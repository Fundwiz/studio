'use client';
import { useState, useEffect } from 'react';
import type { Stock } from '@/lib/types';
import { initialStocks, updateStockPrices } from '@/lib/mock-data';
import { Header } from '@/components/Header';
import { StockRibbon } from '@/components/StockRibbon';
import { StockList } from '@/components/StockList';
import { AddStockForm } from '@/components/AddStockForm';
import { NewsAnalyzer } from '@/components/NewsAnalyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((currentStocks) => updateStockPrices(currentStocks));
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleAddStock = (symbol: string) => {
    if (stocks.some((s) => s.symbol === symbol)) {
      toast({
        variant: "destructive",
        title: "Duplicate Stock",
        description: `Stock with symbol ${symbol} is already in your list.`,
      })
      return;
    }

    const newStock: Stock = {
      symbol: symbol,
      name: 'New Stock Inc.', // Placeholder name
      price: parseFloat((Math.random() * 500 + 50).toFixed(2)), // Random price
      change: 0,
      changePercent: 0,
    };
    setStocks([...stocks, newStock]);
    toast({
        title: "Stock Added",
        description: `${symbol} has been added to your list.`,
      })
  };

  const handleRemoveStock = (symbol: string) => {
    setStocks(stocks.filter((s) => s.symbol !== symbol));
    toast({
        title: "Stock Removed",
        description: `${symbol} has been removed from your list.`,
      })
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <StockRibbon stocks={stocks} />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Watchlist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AddStockForm onAddStock={handleAddStock} />
                <StockList stocks={stocks} onRemove={handleRemoveStock} />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
             <NewsAnalyzer />
          </div>
        </div>
      </main>
      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        TickerSpark &copy; {new Date().getFullYear()} - Financial data is simulated.
      </footer>
    </div>
  );
}
