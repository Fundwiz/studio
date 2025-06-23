'use server';

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type { Index, Option, OptionChain, NiftyTick, RawOptionData } from '@/lib/types';
import { transformOption } from '@/lib/utils';

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
export async function loadAllCallsTicks(): Promise<RawOptionData[]> {
    const callsPath = path.join(process.cwd(), 'src', 'data', 'calls.csv');
    return parseCSV<RawOptionData>(callsPath);
}
export async function loadAllPutsTicks(): Promise<RawOptionData[]> {
    const putsPath = path.join(process.cwd(), 'src', 'data', 'puts.csv');
    return parseCSV<RawOptionData>(putsPath);
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

export async function loadOptionChainData(underlyingPrice: number): Promise<OptionChain | null> {
    try {
        const [callsTicks, putsTicks] = await Promise.all([
          loadAllCallsTicks(),
          loadAllPutsTicks()
        ]);
        
        // Use last tick for initial state
        const lastCallTick = callsTicks[callsTicks.length - 1];
        const lastPutTick = putsTicks[putsTicks.length - 1];

        const calls = lastCallTick ? [transformOption(lastCallTick)] : [];
        const puts = lastPutTick ? [transformOption(lastPutTick)] : [];
        
        return {
            calls,
            puts,
            underlyingPrice
        }
    } catch (error) {
        console.error("Error loading option chain data:", error);
        return null;
    }
}
