'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Stock } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DollarSign, Trash2, TrendingDown, TrendingUp } from 'lucide-react';

type StockListProps = {
  stocks: Stock[];
  onRemove: (symbol: string) => void;
};

export function StockList({ stocks, onRemove }: StockListProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Symbol</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="text-right w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.length > 0 ? (
            stocks.map((stock) => {
              const isPositive = stock.change >= 0;
              const priceChanged = stock.price !== stock.prevPrice && stock.prevPrice !== undefined;
              const priceIncreased = stock.price > (stock.prevPrice ?? 0);

              return (
                <TableRow key={stock.symbol}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-secondary text-secondary-foreground">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{stock.symbol}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{stock.name}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-mono transition-colors duration-500',
                       priceChanged && (priceIncreased ? 'text-green-400' : 'text-red-400')
                    )}
                  >
                    ${stock.price.toFixed(2)}
                  </TableCell>
                  <TableCell className={cn('text-right font-mono', isPositive ? 'text-green-500' : 'text-red-500')}>
                    <div className="flex items-center justify-end gap-2">
                      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span>
                        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onRemove(stock.symbol)} aria-label={`Remove ${stock.name}`}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No stocks added. Add a stock to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
