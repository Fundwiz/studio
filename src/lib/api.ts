'use server';
import { config } from 'dotenv';
config(); // Load environment variables from .env file

import type { Index, Option, OptionChain } from '@/lib/types';
import { initialIndices, updateIndexPrices, getMockOptionChain } from '@/lib/mock-data';
import BreezeConnect from 'breezeconnect';
import { format, addDays } from 'date-fns';

// --- Configuration ---
const BREEZE_API_KEY = process.env.BREEZE_API_KEY;
const BREEZE_API_SECRET = process.env.BREEZE_API_SECRET;
const BREEZE_SESSION_TOKEN = process.env.BREEZE_SESSION_TOKEN;

const USE_MOCK_DATA = !BREEZE_API_KEY || !BREEZE_API_SECRET || !BREEZE_SESSION_TOKEN;

// Map user-friendly symbols to Breeze API stock codes
const BREEZE_STOCK_CODES: { [key: string]: { exchange: string; code: string } } = {
    'NIFTY 50': { exchange: 'NFO', code: 'NIFTY' }, // Note: For indices, different endpoints are often used. This is a simplification.
    'NIFTY BANK': { exchange: 'NFO', code: 'BANKNIFTY' },
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
        throw new Error("Breeze API not initialized.");
    }
    try {
        await breeze.generateSession({ apiSecret: BREEZE_API_SECRET!, sessionToken: BREEZE_SESSION_TOKEN! });
        return breeze;
    } catch (error) {
        console.error("Breeze API session generation failed:", error);
        throw new Error("Failed to generate Breeze API session. Check your credentials.");
    }
}


export async function fetchInitialIndices(): Promise<Index[]> {
  if (USE_MOCK_DATA) {
    console.log("Fetching initial indices from mock data (Breeze API credentials not provided).");
    return Promise.resolve(JSON.parse(JSON.stringify(initialIndices)));
  }

  try {
    const breeze = await getBreezeInstance();
    const symbols = Object.keys(BREEZE_STOCK_CODES);
    
    // NOTE: getQuotes may not work for indices directly. You might need a different endpoint like get_names.
    // This is a simplified example.
    const quotePromises = symbols.map(async (symbol) => {
        const { exchange, code } = BREEZE_STOCK_CODES[symbol];
        const quote = await breeze.getQuotes({
            stockCode: code,
            exchangeCode: exchange,
            interval: "1minute", // This might not be applicable for all indices
            fromDate: format(new Date(), 'yyyy-MM-dd') + "T07:00:00.000Z",
            toDate: format(new Date(), 'yyyy-MM-dd') + "T07:00:00.000Z",
        });

        if (quote.Success && quote.Success.length > 0) {
            const data = quote.Success[0];
            return {
                symbol: symbol,
                name: data.stock_name || symbol,
                price: parseFloat(data.ltp),
                change: parseFloat(data.change),
                changePercent: parseFloat(data.percent_change),
            } as Index;
        }
        // Fallback for this symbol if API fails
        return initialIndices.find(i => i.symbol === symbol)!;
    });

    const results = await Promise.all(quotePromises);
    return results.filter(r => r); // Filter out any undefined results
  } catch(error) {
    console.error("Failed to fetch live initial indices, falling back to mock data.", error);
    return Promise.resolve(JSON.parse(JSON.stringify(initialIndices)));
  }
}

export async function fetchUpdatedIndices(currentIndices: Index[]): Promise<Index[]> {
    if (USE_MOCK_DATA) {
        return Promise.resolve(updateIndexPrices(currentIndices));
    }
    
    // For live data, we can just re-fetch the initial state as it will be the latest.
    // A more advanced implementation would use WebSockets if the API supports it.
    try {
        const liveIndices = await fetchInitialIndices();
        return liveIndices.map(liveIndex => {
            const prevIndex = currentIndices.find(c => c.symbol === liveIndex.symbol);
            return {
                ...liveIndex,
                prevPrice: prevIndex ? prevIndex.price : liveIndex.price,
            };
        });
    } catch(error) {
        console.error("Failed to fetch live updated indices, falling back to mock data.", error);
        return Promise.resolve(updateIndexPrices(currentIndices));
    }
}

export async function fetchOptionChain(underlyingPrice: number): Promise<OptionChain> {
    if (USE_MOCK_DATA) {
        return Promise.resolve(getMockOptionChain(underlyingPrice));
    }
    
    try {
        const breeze = await getBreezeInstance();
        // Example: Fetching for the next weekly expiry
        const nextThursday = addDays(new Date(), (4 - new Date().getDay() + 7) % 7);
        const expiryDate = format(nextThursday, "yyyy-MM-dd'T06:00:00.000Z'");

        const optionData = await breeze.getOptionChainQuotes({
            stockCode: "NIFTY",
            exchangeCode: "NFO",
            productType: "options",
            expiryDate: expiryDate,
            right: "others", // Fetches both Calls and Puts
            strikePrice: "" // All strikes
        });

        if (!optionData.Success) {
            throw new Error("Failed to fetch option chain from Breeze API.");
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

        return {
            calls: calls.sort((a,b) => a.strike - b.strike),
            puts: puts.sort((a,b) => a.strike - b.strike),
            underlyingPrice: underlyingPrice // Can be updated with a more direct quote if needed
        };

    } catch(error) {
        console.error("Failed to fetch live option chain, falling back to mock data.", error);
        return Promise.resolve(getMockOptionChain(underlyingPrice));
    }
}
