'use server';

import type { Index, Option, OptionChain, FetchedData } from '@/lib/types';
import { initialIndices, updateIndexPrices, getMockOptionChain } from '@/lib/mock-data';
import BreezeConnect from 'breezeconnect';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

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

let breeze: any | null = null;

if (!USE_MOCK_DATA) {
    breeze = new BreezeConnect({ appKey: BREEZE_API_KEY! });
}

// Helper function to initialize the Breeze API session
async function getBreezeInstance() {
    if (!breeze) {
        throw new Error("Breeze API not configured. Check environment variables.");
    }
    // Attempt to generate a session every time to ensure it's valid.
    // The library may handle caching or re-authentication internally.
    try {
        await breeze.generateSession({ apiSecret: BREEZE_API_SECRET!, sessionToken: BREEZE_SESSION_TOKEN! });
        return breeze;
    } catch (error: any) {
        console.error("Breeze API session generation failed:", error.message);
        throw new Error(`Failed to generate Breeze API session. Your token may have expired or credentials may be invalid.`);
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
    
    // Use a wider date range to ensure we get data
    const today = new Date();
    const fromDate = format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    const toDate = format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    const quotePromises = symbols.map(async (symbol) => {
        const { exchange, code } = BREEZE_STOCK_CODES[symbol];
        const quote = await breeze.getQuotes({
            stockCode: code,
            exchangeCode: exchange,
            interval: "1day", // Use 1day interval to get the latest close/ltp
            fromDate: fromDate,
            toDate: toDate,
        });

        if (quote.Success && quote.Success.length > 0) {
            const data = quote.Success[quote.Success.length - 1]; // Get the most recent data point
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
             // Fallback to mock for this specific index if API fails for it
             return initialIndices.find(i => i.symbol === symbol)!;
        }
    });

    const results = await Promise.all(quotePromises);
    return { data: results.filter(r => r), source: 'live' };
  } catch(error: any) {
    console.error("Failed to fetch live initial indices, falling back to all mock data.", error);
    return { data: JSON.parse(JSON.stringify(initialIndices)), source: 'mock', error: error.message };
  }
}

export async function fetchUpdatedIndices(currentIndices: Index[]): Promise<FetchedData<Index[]>> {
    if (USE_MOCK_DATA) {
        return { data: updateIndexPrices(currentIndices), source: 'mock' };
    }
    
    // Just re-fetch the initial data which gets the latest quotes
    const liveDataResult = await fetchInitialIndices();
    if (liveDataResult.source === 'live') {
        const updatedData = liveDataResult.data.map(liveIndex => {
            const prevIndex = currentIndices.find(c => c.symbol === liveIndex.symbol);
            return {
                ...liveIndex,
                prevPrice: prevIndex ? prevIndex.price : liveIndex.price,
            };
        });
        return { ...liveDataResult, data: updatedData };
    }
    
    // If fetching live data fails, fallback to mock updates
    return { data: updateIndexPrices(currentIndices), source: 'mock', error: liveDataResult.error };
}

export async function fetchOptionChain(underlyingPrice: number): Promise<FetchedData<OptionChain>> {
    if (USE_MOCK_DATA) {
        return { data: getMockOptionChain(underlyingPrice), source: 'mock' };
    }
    
    try {
        const breeze = await getBreezeInstance();
        
        // Find the next weekly expiry (Thursday)
        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday is 0, Thursday is 4
        const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
        const nextThursday = addDays(today, daysUntilThursday === 0 && today.getHours() > 16 ? 7 : daysUntilThursday); // If it's Thursday past market hours, get next week's
        const expiryDate = format(nextThursday, "yyyy-MM-dd'T'06:00:00.000Z");

        const optionData = await breeze.getOptionChainQuotes({
            stockCode: "NIFTY",
            exchangeCode: "NFO",
            productType: "options",
            expiryDate: expiryDate,
            right: "others", // Fetches both Calls and Puts
            strikePrice: "" // Empty fetches the entire chain
        });

        if (!optionData.Success || optionData.Success.length === 0) {
            throw new Error(optionData.Error || "Failed to fetch option chain from Breeze API. The response was empty.");
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
        return { data: getMockOptionChain(underlyingPrice), source: 'mock', error: error.message };
    }
}
