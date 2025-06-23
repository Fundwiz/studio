'use server';
import { config } from 'dotenv';
config(); // Load environment variables from .env file

import type { Index, Option, OptionChain, FetchedData } from '@/lib/types';
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
    'NIFTY 50': { exchange: 'NFO', code: 'NIFTY' },
    'NIFTY BANK': { exchange: 'NFO', code: 'BANKNIFTY' },
    'NIFTY IT': { exchange: 'NSE', code: 'CNXIT' },
    'SENSEX': { exchange: 'BSE', code: 'SENSEX' },
};

let breeze: any | null = null;
let breezeSessionInitialized = false;

if (!USE_MOCK_DATA) {
    breeze = new BreezeConnect({ appKey: BREEZE_API_KEY! });
}

// Helper function to initialize the Breeze API session
async function getBreezeInstance() {
    if (!breeze) {
        throw new Error("Breeze API not initialized.");
    }
    if (breezeSessionInitialized) {
        return breeze;
    }
    try {
        await breeze.generateSession({ apiSecret: BREEZE_API_SECRET!, sessionToken: BREEZE_SESSION_TOKEN! });
        breezeSessionInitialized = true;
        return breeze;
    } catch (error: any) {
        console.error("Breeze API session generation failed:", error);
        breezeSessionInitialized = false; // allow retry
        throw new Error(`Failed to generate Breeze API session: ${error.message}. Check your credentials.`);
    }
}

export async function fetchInitialIndices(): Promise<FetchedData<Index[]>> {
  if (USE_MOCK_DATA) {
    console.log("Fetching initial indices from mock data (Breeze API credentials not provided).");
    return { data: JSON.parse(JSON.stringify(initialIndices)), source: 'mock' };
  }

  try {
    const breeze = await getBreezeInstance();
    const symbols = Object.keys(BREEZE_STOCK_CODES);
    
    const quotePromises = symbols.map(async (symbol) => {
        const { exchange, code } = BREEZE_STOCK_CODES[symbol];
        const quote = await breeze.getQuotes({
            stockCode: code,
            exchangeCode: exchange,
            interval: "1minute",
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
        return initialIndices.find(i => i.symbol === symbol)!;
    });

    const results = await Promise.all(quotePromises);
    return { data: results.filter(r => r), source: 'live' };
  } catch(error: any) {
    console.error("Failed to fetch live initial indices, falling back to mock data.", error);
    return { data: JSON.parse(JSON.stringify(initialIndices)), source: 'mock', error: error.message };
  }
}

export async function fetchUpdatedIndices(currentIndices: Index[]): Promise<FetchedData<Index[]>> {
    if (USE_MOCK_DATA) {
        return { data: updateIndexPrices(currentIndices), source: 'mock' };
    }
    
    try {
        const liveData = await fetchInitialIndices();
        const updatedData = liveData.data.map(liveIndex => {
            const prevIndex = currentIndices.find(c => c.symbol === liveIndex.symbol);
            return {
                ...liveIndex,
                prevPrice: prevIndex ? prevIndex.price : liveIndex.price,
            };
        });
        return { ...liveData, data: updatedData };
    } catch(error: any) {
        console.error("Failed to fetch live updated indices, falling back to mock data.", error);
        return { data: updateIndexPrices(currentIndices), source: 'mock', error: error.message };
    }
}

export async function fetchOptionChain(underlyingPrice: number): Promise<FetchedData<OptionChain>> {
    if (USE_MOCK_DATA) {
        return { data: getMockOptionChain(underlyingPrice), source: 'mock' };
    }
    
    try {
        const breeze = await getBreezeInstance();
        const nextThursday = addDays(new Date(), (4 - new Date().getDay() + 7) % 7);
        const expiryDate = format(nextThursday, "yyyy-MM-dd'T06:00:00.000Z'");

        const optionData = await breeze.getOptionChainQuotes({
            stockCode: "NIFTY",
            exchangeCode: "NFO",
            productType: "options",
            expiryDate: expiryDate,
            right: "others",
            strikePrice: ""
        });

        if (!optionData.Success) {
            throw new Error(optionData.Error || "Failed to fetch option chain from Breeze API.");
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
