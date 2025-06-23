'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Index } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BarChart, TrendingDown, TrendingUp } from 'lucide-react';

type IndexListProps = {
  stocks: Index[];
};

export function StockList({ stocks: indices }: IndexListProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Index</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indices.length > 0 ? (
            indices.map((index) => {
              const isPositive = index.change >= 0;
              const priceChanged = index.price !== index.prevPrice && index.prevPrice !== undefined;
              const priceIncreased = index.price > (index.prevPrice ?? 0);

              return (
                <TableRow key={index.symbol}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-secondary text-secondary-foreground">
                        <BarChart className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{index.symbol}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{index.name}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-mono transition-colors duration-500',
                       priceChanged && (priceIncreased ? 'text-green-400' : 'text-red-400')
                    )}
                  >
                    ₹{index.price.toFixed(2)}
                  </TableCell>
                  <TableCell className={cn('text-right font-mono', isPositive ? 'text-green-500' : 'text-red-500')}>
                    <div className="flex items-center justify-end gap-2">
                      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span>
                        {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No indices to display.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
