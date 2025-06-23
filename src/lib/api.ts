'use server';

import type { Index, Option, OptionChain, FetchedData } from '@/lib/types';
import { initialIndices, updateIndexPrices, getMockOptionChain } from '@/lib/mock-data';
import BreezeConnect from 'breezeconnect';

// --- Configuration ---
const BREEZE_API_KEY = process.env.BREEZE_API_KEY;
const BREEZE_API_SECRET = process.env.BREEZE_API_SECRET;
const BREEZE_SESSION_TOKEN = process.env.BREEZE_SESSION_TOKEN;

const USE_MOCK_DATA = !BREEZE_API_KEY || !BREEZE_API_SECRET || !BREEZE_SESSION_TOKEN;

// Map user-friendly symbols to Breeze API stock codes
const BREEZE_STOCK_CODES: { [key: string]: { exchange: string; code: string } } = {
    'NIFTY 50': { exchange: 'NSE', code: 'NIFTY' },
    'NIFTY BANK': { exchange: 'NSE', code: 'BANKNIFTY' },
    'NIFTY IT': { exchange: 'NSE', code: 'CNXIT' },
    'SENSEX': { exchange: 'BSE', code: 'SENSEX' },
};

// Helper function to initialize the Breeze API session
async function getBreezeInstance() {
    if (USE_MOCK_DATA) {
        throw new Error("Breeze API not configured. Check environment variables.");
    }

    try {
        const breeze = new BreezeConnect({ appKey: BREEZE_API_KEY! });
        await breeze.generateSession({ apiSecret: BREEZE_API_SECRET!, sessionToken: BREEZE_SESSION_TOKEN! });
        return breeze;
    } catch (error: any) {
        console.error("Breeze API session generation failed:", error);
        throw new Error(`Failed to generate Breeze API session. Your session token may have expired or credentials may be invalid. Please regenerate your session token. Original error: ${error.message}`);
    }
}

export async function fetchInitialIndices(): Promise<FetchedData<Index[]>> {
  if (USE_MOCK_DATA) {
    console.log("Using mock data because Breeze API credentials are not provided.");
    return { data: JSON.parse(JSON.stringify(initialIndices)), source: 'mock' };
  }

  try {
    const breeze = await getBreezeInstance();
    const symbols = Object.keys(BREEZE_STOCK_CODES);
    const finalIndices: Index[] = [];
    let allFailed = true;

    const quotePromises = symbols.map(async (symbol) => {
        const { exchange, code } = BREEZE_STOCK_CODES[symbol];
        
        try {
            const quote = await breeze.getQuotes({
                stockCode: code,
                exchangeCode: exchange,
            });

            if (quote.Success && quote.Success.length > 0) {
                const data = quote.Success[0];
                allFailed = false; // At least one succeeded
                return {
                    symbol: symbol,
                    name: data.stock_name || symbol,
                    price: parseFloat(data.ltp),
                    change: parseFloat(data.change),
                    changePercent: parseFloat(data.percent_change),
                    prevPrice: parseFloat(data.ltp) - parseFloat(data.change),
                } as Index;
            } else {
                 console.warn(`No live data for ${symbol}. API Response:`, quote.Error || 'Empty success array');
                 return initialIndices.find(i => i.symbol === symbol)!;
            }
        } catch (err) {
            console.error(`Error fetching quote for ${symbol}:`, err);
            return initialIndices.find(i => i.symbol === symbol)!; // Fallback for this specific index
        }
    });

    const results = await Promise.all(quotePromises);
    
    if (allFailed) {
        throw new Error("All live index data requests failed.");
    }

    return { data: results.filter(r => r) as Index[], source: 'live' };

  } catch(error: any) {
    console.error("Failed to fetch live initial indices, falling back to all mock data.", error);
    return { data: JSON.parse(JSON.stringify(initialIndices)), source: 'mock', error: `Failed to fetch live indices. ${error.message}` };
  }
}

export async function fetchUpdatedIndices(currentIndices: Index[]): Promise<FetchedData<Index[]>> {
    if (USE_MOCK_DATA) {
        return { data: updateIndexPrices(currentIndices), source: 'mock' };
    }
    
    // This function re-fetches all indices to get the latest prices
    const liveDataResult = await fetchInitialIndices();
    if (liveDataResult.source === 'live') {
        // Map previous prices to new data for animation
        const updatedData = liveDataResult.data.map(liveIndex => {
            const prevIndex = currentIndices.find(c => c.symbol === liveIndex.symbol);
            return {
                ...liveIndex,
                prevPrice: prevIndex ? prevIndex.price : liveIndex.price,
            };
        });
        return { ...liveDataResult, data: updatedData };
    }
    
    // If live fetch fails, use mock data updater
    return { data: updateIndexPrices(currentIndices), source: 'mock', error: liveDataResult.error };
}

export async function fetchOptionChain(underlyingPrice: number): Promise<FetchedData<OptionChain>> {
    if (USE_MOCK_DATA) {
        return { data: getMockOptionChain(underlyingPrice), source: 'mock' };
    }
    
    try {
        const breeze = await getBreezeInstance();
        
        // Let the API decide the nearest expiry by leaving expiryDate blank
        const optionData = await breeze.getOptionChainQuotes({
            stockCode: "NIFTY",
            exchangeCode: "NFO",
            productType: "options",
            expiryDate: "", // Empty for nearest expiry
            right: "others", // Fetches both Calls and Puts
            strikePrice: "" // Fetches for all strike prices
        });

        if (!optionData.Success || optionData.Success.length === 0) {
            const errorMessage = optionData.Error ? `Breeze API Error: ${optionData.Error}` : "Failed to fetch option chain. The API response was empty.";
            throw new Error(errorMessage);
        }

        const transformOption = (breezeOption: any): Option => ({
            strike: parseFloat(breezeOption.strike_price),
            ltp: parseFloat(breezeOption.ltp),
            iv: parseFloat(breezeOption.iv || "0"),
            chng: parseFloat(breezeOption.change),
            chngInOI: parseFloat(breezeOption.open_interest_change),
            oi: parseFloat(breezeOption.open_interest),
            volume: parseFloat(breezeOption.total_traded_volume),
            bid: parseFloat(breezeOption.best_bid_price),
            ask: parseFloat(breezeOption.best_ask_price),
        });

        const calls = optionData.Success.filter((o: any) => o.right === "Call").map(transformOption);
        const puts = optionData.Success.filter((o: any) => o.right === "Put").map(transformOption);

        const data = {
            calls: calls.sort((a,b) => a.strike - b.strike),
            puts: puts.sort((a,b) => a.strike - b.strike),
            underlyingPrice: underlyingPrice
        };
        return { data, source: 'live' };

    } catch(error: any) {
        console.error("Failed to fetch live option chain, falling back to mock data.", error);
        return { data: getMockOptionChain(underlyingPrice), source: 'mock', error: `Failed to fetch live option chain. ${error.message}` };
    }
}
