'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';

type AddStockFormProps = {
  onAddStock: (symbol: string) => void;
};

export function AddStockForm({ onAddStock }: AddStockFormProps) {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (symbol.trim()) {
      onAddStock(symbol.trim().toUpperCase());
      setSymbol('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="Enter stock symbol (e.g., AAPL)"
        className="max-w-xs"
        aria-label="Stock Symbol"
      />
      <Button type="submit" variant="outline">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Stock
      </Button>
    </form>
  );
}
