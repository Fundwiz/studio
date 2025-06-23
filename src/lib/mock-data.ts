import type { Index, Option, OptionChain } from '@/lib/types';

/**
 * You can replace this with your own historical data.
 * This is the static data for the main index tickers.
 */
export const initialIndices: Index[] = [
  { symbol: 'NIFTY 50', name: 'NIFTY 50', price: 22500, change: 150.75, changePercent: 0.67, prevPrice: 22349.25 },
  { symbol: 'NIFTY BANK', name: 'NIFTY BANK', price: 48500, change: -250.40, changePercent: -0.51, prevPrice: 48750.40 },
  { symbol: 'NIFTY IT', name: 'NIFTY IT', price: 34800, change: 300.10, changePercent: 0.87, prevPrice: 34499.90 },
  { symbol: 'SENSEX', name: 'BSE SENSEX', price: 74000, change: 450.25, changePercent: 0.61, prevPrice: 73549.75 },
];


const generateOptions = (strike: number, isCall: boolean, underlyingPrice: number): Option => {
    const isITM = isCall ? strike < underlyingPrice : strike > underlyingPrice;
    const distance = Math.abs(strike - underlyingPrice);
    const intrinsicValue = isITM ? distance : 0;
    
    // Extrinsic value decays as we move away from the money, highest at the money
    const extrinsicValue = Math.max(0.1, 60 * Math.exp(-0.006 * distance)); 
    
    const ltp = intrinsicValue + extrinsicValue + (Math.random() * (extrinsicValue * 0.05) - (extrinsicValue * 0.025));

    // Implied Volatility "smile" - higher for OTM/ITM options, lowest ATM
    const iv = 15 + 25 * Math.exp(-0.003 * distance) + (Math.random() * 2 - 1);
    
    return {
        strike,
        ltp: parseFloat(ltp.toFixed(2)),
        iv: parseFloat(iv.toFixed(2)),
        chng: parseFloat(((Math.random() - 0.5) * ltp * 0.1).toFixed(2)), // change up to 10% of ltp
        chngInOI: Math.floor((Math.random() - 0.4) * 50000 + (isITM ? 10000 : -5000)),
        oi: Math.floor(Math.random() * 200000 + (isITM ? 150000 : 20000)),
        volume: Math.floor(Math.random() * 10000 + (isITM ? 5000 : 2000)),
        bid: parseFloat((ltp * 0.995).toFixed(2)),
        ask: parseFloat((ltp * 1.005).toFixed(2)),
    };
};

/**
 * You can replace this with your own historical option chain data.
 * This function generates a sample option chain for a given price.
 */
export const getMockOptionChain = (underlyingPrice: number): OptionChain => {
    const strikes: number[] = [];
    const baseStrike = Math.round(underlyingPrice / 50) * 50;
    for (let i = -15; i <= 15; i++) {
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
