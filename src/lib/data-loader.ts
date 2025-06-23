'use server';

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type { Index, Option, OptionChain, NiftyTick, RawOptionData } from '@/lib/types';

// A generic CSV parsing function
function parseCSV<T>(filePath: string): Promise<T[]> {
  // Check if file exists before trying to read
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV file not found: ${filePath}. Returning empty array.`);
    return Promise.resolve([]);
  }
  const csvFile = fs.readFileSync(filePath, 'utf8');
  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvFile, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
          // Log errors but don't reject, just resolve with what we have
          console.error(`Errors parsing ${filePath}:`, results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        // Reject on critical file read errors
        reject(error);
      },
    });
  });
}


// Hardcoded data for other indices as they don't have CSV files
const otherIndices: Index[] = [
  { symbol: 'NIFTY BANK', name: 'NIFTY BANK', price: 48500, change: -250.40, changePercent: -0.51, prevPrice: 48750.40 },
  { symbol: 'NIFTY IT', name: 'NIFTY IT', price: 34800, change: 300.10, changePercent: 0.87, prevPrice: 34499.90 },
  { symbol: 'SENSEX', name: 'BSE SENSEX', price: 74000, change: 450.25, changePercent: 0.61, prevPrice: 73549.75 },
];

export async function loadAllNiftyTicks(): Promise<NiftyTick[]> {
    const niftyTickPath = path.join(process.cwd(), 'src', 'data', 'nifty_tick.csv');
    return parseCSV<NiftyTick>(niftyTickPath);
}

export async function loadIndicesData(): Promise<Index[]> {
  try {
    const niftyTicks = await loadAllNiftyTicks();
    
    // Use the last row for the most recent tick data
    const latestTick = niftyTicks[niftyTicks.length - 1];

    if (!latestTick) {
        console.warn("nifty_tick.csv is empty or invalid. Using fallback data.");
        // Use a default Nifty50 object if the file is empty
         return [
            { symbol: 'NIFTY 50', name: 'NIFTY 50', price: 22500, change: 150.75, changePercent: 0.67, prevPrice: 22349.25 },
            ...otherIndices
        ];
    }

    const price = latestTick.LTP || 0;
    const change = latestTick.Change || 0;
    const prevPrice = price - change;
    const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

    const nifty50: Index = {
        symbol: 'NIFTY 50',
        name: 'NIFTY 50',
        price: price,
        change: change,
        changePercent: changePercent,
        prevPrice: prevPrice
    };
    
    return [nifty50, ...otherIndices];
  } catch (error) {
    console.error("Error loading indices data:", error);
    // Fallback data in case of error
    return [
        { symbol: 'NIFTY 50', name: 'NIFTY 50', price: 22500, change: 150.75, changePercent: 0.67, prevPrice: 22349.25 },
        ...otherIndices
    ];
  }
}

// Generates a mock full option chain for the frontend
const generateOptions = (isCall: boolean, underlyingPrice: number, strikes: number[]): Option[] => {
    return strikes.map(strike => {
        const inTheMoney = isCall ? strike < underlyingPrice : strike > underlyingPrice;
        const intrinsicValue = isCall ? Math.max(0, underlyingPrice - strike) : Math.max(0, strike - underlyingPrice);
        const timeValue = (Math.random() * 50 + 10) * (inTheMoney ? 0.8 : 1.2);
        const ltp = intrinsicValue + timeValue;
        
        return {
            strike,
            ltp: parseFloat(ltp.toFixed(2)),
            chng: parseFloat(((Math.random() - 0.5) * 20).toFixed(2)),
            oi: (inTheMoney ? 50000 : 150000) + Math.floor(Math.random() * 50000),
            chngInOI: (Math.random() - 0.5) * 5000,
            volume: 100000 + Math.floor(Math.random() * 1000000),
            bid: ltp - 0.05,
            ask: ltp + 0.05,
        };
    });
};

export async function loadOptionChainData(underlyingPrice: number): Promise<OptionChain | null> {
    try {
        console.log(`Generating mock option chain for frontend with underlying price: ${underlyingPrice}...`);
        
        // Generate a range of strikes around the underlying price
        const strikes = Array.from({length: 41}, (_, i) => {
            const base = underlyingPrice * 0.95;
            const range = underlyingPrice * 0.10;
            const step = range / 40;
            return Math.round((base + (i * step)) / 50) * 50;
        });
        const uniqueStrikes = [...new Set(strikes)];

        return {
            underlyingPrice,
            calls: generateOptions(true, underlyingPrice, uniqueStrikes),
            puts: generateOptions(false, underlyingPrice, uniqueStrikes),
        };
    } catch (error) {
        console.error("Error loading option chain data:", error);
        return null;
    }
}
