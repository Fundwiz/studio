'use server';

/**
 * @fileOverview Mock market data services.
 * This file simulates fetching live data from external APIs.
 */

export interface FiiDiiData {
  date: string;
  fii: {
    buy: number; // in Crores
    sell: number; // in Crores
    net: number;  // in Crores
  };
  dii: {
    buy: number; // in Crores
    sell: number; // in Crores
    net: number;  // in Crores
  };
}

export async function getFiidiiData(): Promise<FiiDiiData> {
  // In a real application, this would fetch data from a reliable source.
  // For this demo, we are returning static, sample data.
  console.log('Fetching mock FII/DII data...');
  return {
    date: '2025-06-20',
    fii: {
      buy: 8540,
      sell: 7230,
      net: 1310,
    },
    dii: {
      buy: 5120,
      sell: 6890,
      net: -1770,
    },
  };
}
