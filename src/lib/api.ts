'use server';

import type { Index, OptionChain } from '@/lib/types';
import { initialIndices, updateIndexPrices, getMockOptionChain } from '@/lib/mock-data';

// --- Developer Note ---
// This file is the central place for fetching financial data.
// Currently, it uses mock data. To connect to a real financial data provider:
// 1. Choose a financial data API (e.g., Zerodha Kite Connect, Angel One SmartAPI, or others).
// 2. Implement the API calls inside the functions below.
// 3. You will likely need API keys and to handle authentication with your chosen provider.
// 4. Ensure the data returned from your API calls matches the `Index` and `OptionChain` types defined in src/lib/types.ts.

export async function fetchInitialIndices(): Promise<Index[]> {
  // In a real app, this would be an API call to get the initial list of indices.
  console.log("Fetching initial indices from mock data.");
  // We return a copy to prevent mutation of the original mock data.
  return Promise.resolve(JSON.parse(JSON.stringify(initialIndices)));
}

export async function fetchUpdatedIndices(currentIndices: Index[]): Promise<Index[]> {
    // In a real app, you might make an API call for each symbol to get updated quotes.
    // For this mock implementation, we'll simulate price changes.
    console.log("Fetching updated index prices from mock data.");
    return Promise.resolve(updateIndexPrices(currentIndices));
}

export async function fetchOptionChain(underlyingPrice: number): Promise<OptionChain> {
    // In a real app, this would be an API call to get the option chain for NIFTY 50.
    console.log("Fetching option chain from mock data.");
    return Promise.resolve(getMockOptionChain(underlyingPrice));
}
