'use server';

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type { Index, Option, OptionChain } from '@/lib/types';

const otherIndices: Index[] = [
  { symbol: 'NIFTY BANK', name: 'NIFTY BANK', price: 48500, change: -250.40, changePercent: -0.51, prevPrice: 48750.40 },
  { symbol: 'NIFTY IT', name: 'NIFTY IT', price: 34800, change: 300.10, changePercent: 0.87, prevPrice: 34499.90 },
  { symbol: 'SENSEX', name: 'BSE SENSEX', price: 74000, change: 450.25, changePercent: 0.61, prevPrice: 73549.75 },
];

function parseCSV<T>(filePath: string): Promise<T[]> {
  const csvFile = fs.readFileSync(filePath, 'utf8');
  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvFile, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
          reject(results.errors);
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export async function loadIndicesData(): Promise<Index[]> {
  try {
    const niftyTickPath = path.join(process.cwd(), 'src', 'data', 'nifty_tick.csv');
    const niftyData = await parseCSV<Index>(niftyTickPath);
    
    const allIndices = [...niftyData, ...otherIndices];
    return allIndices;
  } catch (error) {
    console.error("Error loading indices data:", error);
    // Return static data as a fallback
    return [
        { symbol: 'NIFTY 50', name: 'NIFTY 50', price: 22500, change: 150.75, changePercent: 0.67, prevPrice: 22349.25 },
        ...otherIndices
    ];
  }
}

export async function loadOptionChainData(underlyingPrice: number): Promise<OptionChain | null> {
    try {
        const optionChainPath = path.join(process.cwd(), 'src', 'data', 'option_chain.csv');
        const optionsData = await parseCSV<Option & { type: 'call' | 'put' }>(optionChainPath);

        const calls = optionsData
            .filter(o => o.type === 'call')
            .map(({ type, ...rest }) => rest)
            .sort((a,b) => a.strike - b.strike);
        
        const puts = optionsData
            .filter(o => o.type === 'put')
            .map(({ type, ...rest }) => rest)
            .sort((a,b) => a.strike - b.strike);
        
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
