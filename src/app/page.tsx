'use client';
import { useState, useEffect, useRef } from 'react';
import type { Index, Option, OptionChain as OptionChainType, FetchedData } from '@/lib/types';
import { fetchInitialIndices, fetchUpdatedIndices, fetchOptionChain } from '@/lib/api';
import { Header } from '@/components/Header';
import { StockRibbon } from '@/components/StockRibbon';
import { StockList } from '@/components/StockList';
import { NewsAnalyzer } from '@/components/NewsAnalyzer';
import { DataInfo } from '@/components/DataInfo';
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
  const [indices, setIndices] = useState<Index[]>([]);
  const [optionChain, setOptionChain] = useState<OptionChainType | null>(null);
  const [dataStatus, setDataStatus] = useState<'loading' | 'live' | 'mock'>('loading');
  const [apiError, setApiError] = useState<string | null>(null);
  const indicesRef = useRef<Index[]>([]);

  useEffect(() => {
    const updateData = async () => {
      const currentIndices = indicesRef.current;
      
      const indicesResult = currentIndices.length === 0
        ? await fetchInitialIndices()
        : await fetchUpdatedIndices(currentIndices);
      
      setIndices(indicesResult.data);
      indicesRef.current = indicesResult.data;

      const nifty = indicesResult.data.find(i => i.symbol === 'NIFTY 50');
      if (nifty) {
        const optionChainResult = await fetchOptionChain(nifty.price);
        setOptionChain(optionChainResult.data);

        if (indicesResult.source === 'live' && optionChainResult.source === 'live') {
          setDataStatus('live');
          setApiError(null);
        } else {
          setDataStatus('mock');
          setApiError(indicesResult.error || optionChainResult.error || 'Could not connect to live data feed.');
        }
      } else {
          setDataStatus(indicesResult.source);
          setApiError(indicesResult.error || 'NIFTY 50 index data not found.');
      }
    };

    updateData();
    const intervalId = setInterval(updateData, 3000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <StockRibbon stocks={indices} />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <DataInfo status={dataStatus} error={apiError} />
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
