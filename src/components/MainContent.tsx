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

const OptionChain = ({ optionChain }: { optionChain: OptionChainType | null }) => {
    if (!optionChain || (optionChain.calls.length === 0 && optionChain.puts.length === 0)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>NIFTY 50 Option Chain</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No option chain data found in src/data/calls.csv or src/data/puts.csv</p>
                </CardContent>
            </Card>
        )
    }

    const { calls, puts, underlyingPrice } = optionChain;

    const strikes = [...new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)])].sort((a, b) => a - b);
    const callMap = new Map(calls.map(c => [c.strike, c]));
    const putMap = new Map(puts.map(p => [p.strike, p]));

    const mergedChain = strikes.map(strike => ({
        strike,
        call: callMap.get(strike),
        put: putMap.get(strike)
    }));

    const closestStrikeRef = React.useRef<HTMLTableRowElement>(null);
    const scrollAreaRef = React.useRef<ElementRef<typeof ScrollArea>>(null);

    React.useEffect(() => {
        if (closestStrikeRef.current && scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                const { offsetTop } = closestStrikeRef.current;
                const { clientHeight } = viewport;
                // Center the strike price row in the viewport
                viewport.scrollTop = offsetTop - (clientHeight / 2) + (closestStrikeRef.current.clientHeight / 2);
            }
        }
    }, []); 

    let closestStrike = 0;
    if (mergedChain.length > 0) {
        closestStrike = mergedChain.reduce((prev, curr) => 
            Math.abs(curr.strike - underlyingPrice) < Math.abs(prev.strike - underlyingPrice) ? curr : prev
        ).strike;
    }

    const renderLtpCell = (option: Option | undefined, call: boolean) => {
        if (!option) return <TableCell className={cn('p-2', call ? '' : 'text-right')}>-</TableCell>;
        
        const priceChanged = option.ltp !== option.prevLtp && option.prevLtp !== undefined;
        const priceIncreased = option.ltp > (option.prevLtp ?? 0);

        return (
            <TableCell className={cn(
                'p-2 transition-colors duration-200',
                call ? '' : 'text-right',
                call ? (option.strike < underlyingPrice && "bg-green-900/40") : (option.strike > underlyingPrice && "bg-red-900/40"),
                priceChanged && (priceIncreased ? 'bg-green-500/50' : 'bg-red-500/50')
            )}>
                {option ? `₹${option.ltp.toFixed(2)}` : '-'}
            </TableCell>
        );
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
                <ScrollArea className="h-[600px] rounded-md border" ref={scrollAreaRef}>
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                            <TableRow>
                                <TableHead className='p-2 text-center text-green-400 font-bold' colSpan={4}>CALLS</TableHead>
                                <TableHead className='p-2 text-center border-l border-r'>STRIKE</TableHead>
                                <TableHead className='p-2 text-center text-red-400 font-bold' colSpan={4}>PUTS</TableHead>
                            </TableRow>
                            <TableRow>
                                <TableHead className='p-2'>OI</TableHead>
                                <TableHead className='p-2'>Volume</TableHead>
                                <TableHead className='p-2'>Chng %</TableHead>
                                <TableHead className='p-2'>LTP</TableHead>
                                <TableHead className="text-center p-2 font-bold border-l border-r"></TableHead>
                                <TableHead className='p-2 text-right'>LTP</TableHead>
                                <TableHead className='p-2 text-right'>Chng %</TableHead>
                                <TableHead className='p-2 text-right'>Volume</TableHead>
                                <TableHead className='p-2 text-right'>OI</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mergedChain.map((item) => {
                                const callITM = item.call ? item.strike < underlyingPrice : false;
                                const putITM = item.put ? item.strike > underlyingPrice : false;
                                const isClosest = item.strike === closestStrike;
                                return (
                                    <TableRow 
                                        key={item.strike} 
                                        ref={isClosest ? closestStrikeRef : null}
                                        className={cn('text-xs', isClosest && "bg-blue-900/40")}
                                    >
                                        {/* Call Data */}
                                        <TableCell className={cn('p-2', callITM && "bg-green-900/40")}>
                                            {item.call ? `${(item.call.oi / 100000).toFixed(2)}L` : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2', callITM && "bg-green-900/40")}>
                                            {item.call ? `${(item.call.volume / 1000).toFixed(2)}K` : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2', callITM && "bg-green-900/40", item.call && item.call.chng >= 0 ? "text-green-400" : "text-red-400")}>
                                            {item.call ? item.call.chng.toFixed(2) : '-'}
                                        </TableCell>
                                        {renderLtpCell(item.call, true)}

                                        {/* Strike Price */}
                                        <TableCell className="font-bold text-center p-2 bg-card border-l border-r">
                                            {item.strike}
                                        </TableCell>

                                        {/* Put Data */}
                                        {renderLtpCell(item.put, false)}
                                        <TableCell className={cn('p-2 text-right', putITM && "bg-red-900/40", item.put && item.put.chng >= 0 ? "text-green-400" : "text-red-400")}>
                                            {item.put ? item.put.chng.toFixed(2) : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2 text-right', putITM && "bg-red-900/40")}>
                                            {item.put ? `${(item.put.volume / 1000).toFixed(2)}K` : '-'}
                                        </TableCell>
                                        <TableCell className={cn('p-2 text-right', putITM && "bg-red-900/40")}>
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
}

export function MainContent({ indices, optionChain }: MainContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <DataInfo />
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
          <MarketSentimentAnalyzer />
      </div>
    </div>
  );
}
