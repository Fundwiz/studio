'use client';
import * as React from 'react';
import type { ElementRef } from 'react';
import { StockList } from '@/components/StockList';
import { MarketSentimentAnalyzer } from '@/components/NewsAnalyzer';
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
import type { Option, OptionChain as OptionChainType, Index } from '@/lib/types';
import { OptionChainChart } from './OptionChainChart';
import { MaxPainChart } from './MaxPainChart';

const OptionChainTable = ({ optionChain }: { optionChain: OptionChainType | null }) => {
    const getBuildupText = (option: Option | undefined): { text: string; className: string } => {
        if (!option || typeof option.chngInOI !== 'number' || typeof option.chng !== 'number') {
            return { text: '—', className: 'text-muted-foreground' };
        }

        const priceChangedUp = option.chng > 0;
        const priceChangedDown = option.chng < 0;
        const oiChangedUp = option.chngInOI > 0;
        const oiChangedDown = option.chngInOI < 0;

        if (priceChangedUp && oiChangedUp) return { text: 'Long Buildup', className: 'text-green-400' };
        if (priceChangedDown && oiChangedUp) return { text: 'Short Buildup', className: 'text-red-400' };
        if (priceChangedDown && oiChangedDown) return { text: 'Long Unwinding', className: 'text-orange-400' };
        if (priceChangedUp && oiChangedDown) return { text: 'Short Covering', className: 'text-yellow-400' };
        
        return { text: '—', className: 'text-muted-foreground' };
    };

    if (!optionChain || (optionChain.calls.length === 0 && optionChain.puts.length === 0)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>NIFTY 50 Option Chain</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No option chain data available.</p>
                </CardContent>
            </Card>
        )
    }

    const { calls, puts, underlyingPrice } = optionChain;

    const strikes = [...new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)])].sort((a, b) => a - b);
    const callMap = new Map(calls.map(item => [item.strike, item]));
    const putMap = new Map(puts.map(item => [item.strike, item]));

    const mergedChain = strikes.map(strike => ({
        strike,
        call: callMap.get(strike),
        put: putMap.get(strike)
    }));

    const closestStrikeRef = React.useRef<HTMLTableRowElement>(null);
    const scrollAreaRef = React.useRef<ElementRef<typeof ScrollArea>>(null);

    React.useEffect(() => {
        if (closestStrikeRef.current && scrollAreaRef.current) {
            const viewport = (scrollAreaRef.current as any).querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                const { offsetTop } = closestStrikeRef.current;
                const { clientHeight } = viewport;
                viewport.scrollTop = offsetTop - (clientHeight / 2) + (closestStrikeRef.current.clientHeight / 2);
            }
        }
    }, [underlyingPrice]); 

    let closestStrike = 0;
    if (mergedChain.length > 0) {
        closestStrike = mergedChain.reduce((prev, curr) => 
            Math.abs(curr.strike - underlyingPrice) < Math.abs(prev.strike - underlyingPrice) ? curr : prev
        ).strike;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>NIFTY 50 Option Chain</CardTitle>
                <CardDescription>
                    Displaying option chain data for NIFTY 50. Underlying Price: <span className='font-bold text-primary'>₹{underlyingPrice.toFixed(2)}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[600px] w-full rounded-md border" ref={scrollAreaRef} type="always">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                            <TableRow>
                                <TableHead className='p-2 text-center text-green-400 font-bold' colSpan={5}>CALLS</TableHead>
                                <TableHead className='p-2 text-center border-l border-r' colSpan={3}>STRIKE &amp; PCR</TableHead>
                                <TableHead className='p-2 text-center text-red-400 font-bold' colSpan={5}>PUTS</TableHead>
                            </TableRow>
                            <TableRow>
                                <TableHead className='p-2'>OI</TableHead>
                                <TableHead className='p-2'>Buildup</TableHead>
                                <TableHead className='p-2'>Volume</TableHead>
                                <TableHead className='p-2'>Chng</TableHead>
                                <TableHead className='p-2'>LTP</TableHead>
                                <TableHead className="text-center p-2 font-bold border-l">STRIKE</TableHead>
                                <TableHead className="text-center p-2">OI PCR</TableHead>
                                <TableHead className="text-center p-2 border-r">VOL PCR</TableHead>
                                <TableHead className='p-2 text-right'>LTP</TableHead>
                                <TableHead className='p-2 text-right'>Chng</TableHead>
                                <TableHead className='p-2 text-right'>Volume</TableHead>
                                <TableHead className='p-2 text-right'>Buildup</TableHead>
                                <TableHead className='p-2 text-right'>OI</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mergedChain.map((item) => {
                                const isClosest = item.strike === closestStrike;
                                const callITM = item.call ? item.strike < underlyingPrice : false;
                                const putITM = item.put ? item.strike > underlyingPrice : false;

                                const callBgClass = isClosest ? "bg-accent/20" : callITM ? "bg-green-900/50" : "";
                                const putBgClass = isClosest ? "bg-accent/20" : putITM ? "bg-red-900/50" : "";
                                const neutralBgClass = isClosest ? "bg-accent/20" : "";

                                const callLtpChanged = item.call && item.call.ltp !== item.call.prevLtp && item.call.prevLtp !== undefined;
                                const callLtpIncreased = item.call && item.call.ltp > (item.call.prevLtp ?? 0);
                                const callLtpFlashClass = callLtpChanged ? (callLtpIncreased ? 'bg-green-500/50' : 'bg-red-500/50') : '';

                                const putLtpChanged = item.put && item.put.ltp !== item.put.prevLtp && item.put.prevLtp !== undefined;
                                const putLtpIncreased = item.put && item.put.ltp > (item.put.prevLtp ?? 0);
                                const putLtpFlashClass = putLtpChanged ? (putLtpIncreased ? 'bg-green-500/50' : 'bg-red-500/50') : '';

                                const oiPcr = (item.put?.oi && item.call?.oi && item.call.oi > 0) 
                                    ? (item.put.oi / item.call.oi).toFixed(2) 
                                    : '-';
                                const volPcr = (item.put?.volume && item.call?.volume && item.call.volume > 0)
                                    ? (item.put.volume / item.call.volume).toFixed(2)
                                    : '-';
                                const callBuildup = getBuildupText(item.call);
                                const putBuildup = getBuildupText(item.put);
                                    
                                return (
                                    <TableRow key={item.strike} ref={isClosest ? closestStrikeRef : null} className='text-xs'>
                                        {/* Call Data */}
                                        <TableCell className={cn('p-2', callBgClass)}>
                                            {item.call ? `${(item.call.oi / 100000).toFixed(2)}L` : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2 font-medium whitespace-nowrap', callBuildup.className, callBgClass)}>
                                            {callBuildup.text}
                                        </TableCell>
                                        <TableCell className={cn('p-2', callBgClass)}>
                                            {item.call ? `${(item.call.volume / 1000).toFixed(2)}K` : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2', item.call && item.call.chng >= 0 ? "text-green-400" : "text-red-400", callBgClass)}>
                                            {item.call ? item.call.chng.toFixed(2) : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2 transition-colors duration-200', callLtpFlashClass || callBgClass)}>
                                            {item.call ? `₹${item.call.ltp.toFixed(2)}` : '-'}
                                        </TableCell>

                                        {/* Strike Price & PCR */}
                                        <TableCell className={cn("font-bold text-center p-2 border-l", neutralBgClass)}>
                                            {item.strike}
                                        </TableCell>
                                        <TableCell className={cn("font-mono text-center p-2", neutralBgClass)}>
                                            {oiPcr}
                                        </TableCell>
                                        <TableCell className={cn("font-mono text-center p-2 border-r", neutralBgClass)}>
                                            {volPcr}
                                        </TableCell>

                                        {/* Put Data */}
                                        <TableCell className={cn('p-2 text-right transition-colors duration-200', putLtpFlashClass || putBgClass)}>
                                            {item.put ? `₹${item.put.ltp.toFixed(2)}` : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2 text-right', item.put && item.put.chng >= 0 ? "text-green-400" : "text-red-400", putBgClass)}>
                                            {item.put ? item.put.chng.toFixed(2) : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2 text-right', putBgClass)}>
                                            {item.put ? `${(item.put.volume / 1000).toFixed(2)}K` : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2 text-right font-medium whitespace-nowrap', putBuildup.className, putBgClass)}>
                                            {putBuildup.text}
                                        </TableCell>
                                        <TableCell className={cn('p-2 text-right', putBgClass)}>
                                            {item.put ? `${(item.put.oi / 100000).toFixed(2)}L` : '-'}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

type MainContentProps = {
    indices: Index[];
    optionChain: OptionChainType | null;
    maxPainHistory: { timestamp: number; strike: number; }[];
}

export function MainContent({ indices, optionChain, maxPainHistory }: MainContentProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
      <div className="xl:col-span-4 space-y-6">
        <DataInfo />
        <Card>
          <CardHeader>
            <CardTitle>Market Indices</CardTitle>
          </CardHeader>
          <CardContent>
            <StockList stocks={indices} />
          </CardContent>
        </Card>
        <OptionChainChart optionChain={optionChain} />
        <MaxPainChart optionChain={optionChain} maxPainHistory={maxPainHistory} />
        <OptionChainTable optionChain={optionChain} />
      </div>
      <div className="xl:col-span-1">
          <MarketSentimentAnalyzer />
      </div>
    </div>
  );
}
