'use client';
import { useState, useEffect } from 'react';
import type { Index, Option, OptionChain as OptionChainType } from '@/lib/types';
import { initialIndices, updateIndexPrices, getMockOptionChain } from '@/lib/mock-data';
import { Header } from '@/components/Header';
import { StockRibbon } from '@/components/StockRibbon';
import { StockList } from '@/components/StockList';
import { NewsAnalyzer } from '@/components/NewsAnalyzer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// -- Option Chain Component defined locally --
const OptionTable = ({ title, options, isCall, underlyingPrice }: { title: string, options: Option[], isCall: boolean, underlyingPrice: number }) => (
    <div className='flex-1'>
        <h3 className={cn("text-lg font-semibold text-center mb-2", isCall ? "text-green-400" : "text-red-400")}>{title}</h3>
        <ScrollArea className="h-[400px] rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className='p-2'>OI</TableHead>
                        <TableHead className='p-2'>Chng in OI</TableHead>
                        <TableHead className='p-2'>Volume</TableHead>
                        <TableHead className='p-2'>IV</TableHead>
                        <TableHead className='p-2'>LTP</TableHead>
                        <TableHead className='p-2'>Chng</TableHead>
                        <TableHead className="text-right p-2">Strike</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {options.map((option) => {
                        const isITM = isCall ? option.strike < underlyingPrice : option.strike > underlyingPrice;
                        return (
                            <TableRow key={option.strike} className={cn('text-xs', isITM && (isCall ? "bg-green-900/40" : "bg-red-900/40"))}>
                                <TableCell className='p-2'>{(option.oi / 100000).toFixed(2)}L</TableCell>
                                <TableCell className={cn('p-2', option.chngInOI > 0 ? "text-green-400" : "text-red-400")}>
                                    {(option.chngInOI / 1000).toFixed(2)}K
                                </TableCell>
                                <TableCell className='p-2'>{(option.volume / 1000).toFixed(2)}K</TableCell>
                                <TableCell className='p-2'>{option.iv}</TableCell>
                                <TableCell className='p-2'>₹{option.ltp.toFixed(2)}</TableCell>
                                <TableCell className={cn('p-2', option.chng > 0 ? "text-green-400" : "text-red-400")}>{option.chng.toFixed(2)}</TableCell>
                                <TableCell className="font-bold text-right p-2 bg-card/80">{option.strike}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </ScrollArea>
    </div>
);

const OptionChain = ({ optionChain }: { optionChain: OptionChainType | null }) => {
    if (!optionChain) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>NIFTY 50 Option Chain</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Loading option chain data...</p>
                </CardContent>
            </Card>
        )
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>NIFTY 50 Option Chain</CardTitle>
                <CardDescription>
                    Live option chain data for NIFTY 50. Underlying Price: <span className='font-bold text-primary'>₹{optionChain.underlyingPrice.toFixed(2)}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 w-full">
                    <OptionTable title="CALLS" options={optionChain.calls} isCall={true} underlyingPrice={optionChain.underlyingPrice} />
                    <OptionTable title="PUTS" options={optionChain.puts} isCall={false} underlyingPrice={optionChain.underlyingPrice} />
                </div>
            </CardContent>
        </Card>
    );
}
// -- End of local component --

export default function Home() {
  const [indices, setIndices] = useState<Index[]>(initialIndices);
  const [optionChain, setOptionChain] = useState<OptionChainType | null>(null);

  useEffect(() => {
    const initialNifty = initialIndices.find(i => i.symbol === 'NIFTY 50');
    if (initialNifty) {
      setOptionChain(getMockOptionChain(initialNifty.price));
    }

    const interval = setInterval(() => {
      setIndices(currentIndices => {
        const updatedIndices = updateIndexPrices(currentIndices);
        const newNifty = updatedIndices.find(i => i.symbol === 'NIFTY 50');

        if (newNifty) {
          setOptionChain(getMockOptionChain(newNifty.price));
        }
        return updatedIndices;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <StockRibbon stocks={indices} />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Indices</CardTitle>
              </CardHeader>
              <CardContent>
                <StockList stocks={indices} />
              </CardContent>
            </Card>
            <OptionChain optionChain={optionChain} />
          </div>
          <div className="lg:col-span-1">
             <NewsAnalyzer />
          </div>
        </div>
      </main>
      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        NiftyPulse &copy; {new Date().getFullYear()} - Financial data is simulated.
      </footer>
    </div>
  );
}
