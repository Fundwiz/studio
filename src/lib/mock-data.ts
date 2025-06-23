import type { Stock } from '@/lib/types';

export const initialStocks: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 172.47, change: 1.23, changePercent: 0.72 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 139.44, change: -0.89, changePercent: -0.63 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 370.95, change: 2.15, changePercent: 0.58 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 153.84, change: -1.45, changePercent: -0.93 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 234.30, change: 5.67, changePercent: 2.48 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 476.90, change: -3.12, changePercent: -0.65 },
  { symbol: 'META', name: 'Meta Platforms', price: 334.82, change: 1.98, changePercent: 0.60 },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 157.21, change: 0.76, changePercent: 0.49 },
];

export function updateStockPrices(stocks: Stock[]): Stock[] {
  return stocks.map(stock => {
    const change = (Math.random() - 0.5) * (stock.price * 0.02); // up to 2% change
    const newPrice = Math.max(0, stock.price + change);
    const changePercent = (change / stock.price) * 100;
    
    return {
      ...stock,
      prevPrice: stock.price,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    };
  });
};
