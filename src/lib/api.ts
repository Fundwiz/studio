'use server';

import type { Index, OptionChain, FetchedData } from '@/lib/types';
import { initialIndices, getMockOptionChain, updateIndexPrices } from '@/lib/mock-data';

const VM_API_URL = process.env.NEXT_PUBLIC_VM_API_URL;

export async function fetchInitialIndices(): Promise<FetchedData<Index[]>> {
  if (!VM_API_URL || VM_API_URL.includes('YOUR_VM_IP_ADDRESS')) {
    console.log("VM_API_URL not configured, using mock data.");
    return { data: JSON.parse(JSON.stringify(initialIndices)), source: 'mock', error: 'Backend service URL is not configured.' };
  }

  try {
    const res = await fetch(`${VM_API_URL}/api/indices`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Backend service returned status ${res.status}`);
    }
    const data = await res.json();
    return { data, source: 'live' };
  } catch (error: any) {
    console.error("Failed to fetch from VM backend:", error);
    return { 
      data: JSON.parse(JSON.stringify(initialIndices)), 
      source: 'mock', 
      error: `Could not connect to backend service at ${VM_API_URL}. Falling back to mock data. Error: ${error.message}` 
    };
  }
}

export async function fetchUpdatedIndices(currentIndices: Index[]): Promise<FetchedData<Index[]>> {
    const result = await fetchInitialIndices();
    
    if (result.source === 'live') {
        const updatedData = result.data.map(liveIndex => {
            const prevIndex = currentIndices.find(c => c.symbol === liveIndex.symbol);
            return {
                ...liveIndex,
                prevPrice: prevIndex ? prevIndex.price : liveIndex.price,
            };
        });
        return { ...result, data: updatedData };
    }
    
    // If fetch failed, use mock updater
    return { ...result, data: updateIndexPrices(currentIndices) };
}

export async function fetchOptionChain(underlyingPrice: number): Promise<FetchedData<OptionChain>> {
  if (!VM_API_URL || VM_API_URL.includes('YOUR_VM_IP_ADDRESS')) {
     return { data: getMockOptionChain(underlyingPrice), source: 'mock', error: 'Backend service URL is not configured.' };
  }

  try {
    const res = await fetch(`${VM_API_URL}/api/option-chain`, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`Backend service returned status ${res.status}`);
    }
    const data = await res.json();
    // The backend might not know the absolute latest underlying price, so we use the one from the main indices feed.
    data.underlyingPrice = underlyingPrice;
    return { data, source: 'live' };
  } catch (error: any) {
    console.error("Failed to fetch option chain from VM backend:", error);
    return { 
        data: getMockOptionChain(underlyingPrice), 
        source: 'mock', 
        error: `Could not connect to backend service for option chain data. Falling back to mock data. Error: ${error.message}`
    };
  }
}
