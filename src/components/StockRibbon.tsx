'use client';
import type { Stock } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

type StockRibbonProps = {
  stocks: Stock[];
};

export function StockRibbon({ stocks }: StockRibbonProps) {
  if (!stocks.length) return null;

  const ribbonItems = [...stocks, ...stocks]; // Duplicate for seamless looping

  return (
    <div className="relative w-full overflow-hidden bg-background py-2 border-b">
      <div className="marquee-group flex gap-8 whitespace-nowrap">
        <div className="marquee flex gap-8">
          {ribbonItems.map((stock, index) => {
            const isPositive = stock.change >= 0;
            return (
              <div key={`${stock.symbol}-${index}`} className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">{stock.symbol}</span>
                <span className="text-muted-foreground">₹{stock.price.toFixed(2)}</span>
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    isPositive ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{stock.change.toFixed(2)}</span>
                  <span>({stock.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
