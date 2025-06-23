'use server';

import type { Index, OptionChain } from '@/lib/types';
import { initialIndices, getMockOptionChain } from '@/lib/mock-data';

/**
 * Fetches the initial set of indices. In this mock setup,
 * it returns a static list from the mock-data file.
 */
export async function fetchInitialIndices(): Promise<Index[]> {
  // Directly return the static mock data.
  // The `JSON.parse(JSON.stringify(...))` is a simple way to create a deep copy,
  // preventing accidental mutations of the original mock data.
  return JSON.parse(JSON.stringify(initialIndices));
}

/**
 * Fetches the option chain for a given underlying price. In this mock setup,
 * it generates a sample option chain based on the price.
 * @param underlyingPrice The price of the underlying asset (e.g., NIFTY 50).
 */
export async function fetchOptionChain(underlyingPrice: number): Promise<OptionChain> {
  // Return a dynamically generated mock option chain.
  return getMockOptionChain(underlyingPrice);
}
