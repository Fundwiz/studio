import type { Index, Option, OptionChain } from '@/lib/types';

export const initialIndices: Index[] = [
  { symbol: 'NIFTY 50', name: 'NIFTY 50', price: 22500, change: 150.75, changePercent: 0.67 },
  { symbol: 'NIFTY BANK', name: 'NIFTY BANK', price: 48500, change: -250.40, changePercent: -0.51 },
  { symbol: 'NIFTY IT', name: 'NIFTY IT', price: 34800, change: 300.10, changePercent: 0.87 },
  { symbol: 'SENSEX', name: 'BSE SENSEX', price: 74000, change: 450.25, changePercent: 0.61 },
];

export function updateIndexPrices(indices: Index[]): Index[] {
  return indices.map(index => {
    const change = (Math.random() - 0.5) * (index.price * 0.01); // up to 1% change
    const newPrice = Math.max(0, index.price + change);
    const changePercent = (change / index.price) * 100;
    
    return {
      ...index,
      prevPrice: index.price,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    };
  });
};

const generateOptions = (strike: number, isCall: boolean, underlyingPrice: number): Option => {
    const isITM = isCall ? strike < underlyingPrice : strike > underlyingPrice;
    const ltp = Math.max(0.05, (isCall ? underlyingPrice - strike : strike - underlyingPrice) + (isITM ? 50 : 10) + (Math.random() * 20 - 10));
    return {
        strike,
        ltp: parseFloat(ltp.toFixed(2)),
        iv: parseFloat((20 + Math.random() * 10 - (isITM ? 5 : 0)).toFixed(2)),
        chng: parseFloat(((Math.random() - 0.5) * 10)),
        chngInOI: Math.floor((Math.random() - 0.4) * 100000),
        oi: Math.floor(Math.random() * 500000 + (isITM ? 100000 : 20000)),
        volume: Math.floor(Math.random() * 20000 + 5000),
        bid: parseFloat((ltp * 0.99).toFixed(2)),
        ask: parseFloat((ltp * 1.01).toFixed(2)),
    };
};

export const getMockOptionChain = (underlyingPrice: number): OptionChain => {
    const strikes: number[] = [];
    const baseStrike = Math.round(underlyingPrice / 50) * 50;
    for (let i = -10; i <= 10; i++) {
        strikes.push(baseStrike + i * 50);
    }

    const calls = strikes.map(strike => generateOptions(strike, true, underlyingPrice)).sort((a, b) => a.strike - b.strike);
    const puts = strikes.map(strike => generateOptions(strike, false, underlyingPrice)).sort((a, b) => a.strike - b.strike);

    return {
        calls,
        puts,
        underlyingPrice
    };
};
