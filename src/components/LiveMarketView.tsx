'use client';

import { useState, useEffect } from 'react';
import { StockRibbon } from '@/components/StockRibbon';
import { MainContent } from '@/components/MainContent';
import type { Index, OptionChain, NiftyTick } from '@/lib/types';
import { calculateMaxPain } from '@/lib/utils';

type LiveMarketViewProps = {
  initialIndices: Index[];
  initialOptionChain: OptionChain | null;
  niftyTicks: NiftyTick[];
};

export function LiveMarketView({ 
    initialIndices, 
    initialOptionChain, 
    niftyTicks,
}: LiveMarketViewProps) {
  const [indices, setIndices] = useState<Index[]>(initialIndices);
  const [optionChain, setOptionChain] = useState<OptionChain | null>(initialOptionChain);
  const [tickIndex, setTickIndex] = useState(0);
  const [maxPainHistory, setMaxPainHistory] = useState<{ timestamp: number; strike: number }[]>([]);

  useEffect(() => {
    const niftyTicksCount = niftyTicks.length;
    if (niftyTicksCount === 0 && !initialOptionChain) return;

    const timer = setInterval(() => {
      setTickIndex(prevIndex => {
        const nextIndex = prevIndex + 1;

        // Update Nifty Index
        if (niftyTicksCount > 0) {
            const currentNiftyTick = niftyTicks[nextIndex % niftyTicksCount];
            if (currentNiftyTick) {
                setIndices(currentIndices => {
                    const newIndices = [...currentIndices];
                    const niftyIndex = newIndices.findIndex(i => i.symbol === 'NIFTY 50');

                    if (niftyIndex !== -1) {
                        const oldPrice = newIndices[niftyIndex].price;
                        const newPrice = currentNiftyTick.LTP;
                        const change = currentNiftyTick.Change;
                        const prevClose = newPrice - change;
                        const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
                        
                        newIndices[niftyIndex] = {
                            ...newIndices[niftyIndex],
                            price: newPrice,
                            change: change,
                            changePercent: changePercent,
                            prevPrice: oldPrice,
                        };
                    }
                    return newIndices;
                });
            }
        }
        
        // Update Option Chain and Max Pain History
        setOptionChain(prevChain => {
            if (!prevChain) return null;

            const newChain = JSON.parse(JSON.stringify(prevChain));

            if (newChain.calls.length > 0) {
                const callIndexToUpdate = Math.floor(Math.random() * newChain.calls.length);
                const callToUpdate = newChain.calls[callIndexToUpdate];
                if (callToUpdate) {
                    callToUpdate.prevLtp = callToUpdate.ltp;
                    callToUpdate.ltp += (Math.random() - 0.5) * (callToUpdate.ltp * 0.01);
                    callToUpdate.ltp = Math.max(0.05, parseFloat(callToUpdate.ltp.toFixed(2)));
                }
            }

            if (newChain.puts.length > 0) {
                const putIndexToUpdate = Math.floor(Math.random() * newChain.puts.length);
                const putToUpdate = newChain.puts[putIndexToUpdate];
                if (putToUpdate) {
                    putToUpdate.prevLtp = putToUpdate.ltp;
                    putToUpdate.ltp += (Math.random() - 0.5) * (putToUpdate.ltp * 0.01);
                    putToUpdate.ltp = Math.max(0.05, parseFloat(putToUpdate.ltp.toFixed(2)));
                }
            }
            
            const nifty = indices.find(i => i.symbol === 'NIFTY 50');
            if (nifty) {
                newChain.underlyingPrice = nifty.price;
            }

            // Calculate Max Pain and update history
            const { maxPainStrike } = calculateMaxPain(newChain);
            if (maxPainStrike > 0) {
                 setMaxPainHistory(prevHistory => {
                    const now = Date.now();
                    const oneHourAgo = now - 60 * 60 * 1000;
                    
                    const lastEntry = prevHistory[prevHistory.length - 1];
                    // Only add a new entry if the strike has changed to avoid redundant data
                    if (!lastEntry || lastEntry.strike !== maxPainStrike) {
                        const newHistoryEntry = { timestamp: now, strike: maxPainStrike };
                        const updatedHistory = [...prevHistory, newHistoryEntry];
                        return updatedHistory.filter(item => item.timestamp >= oneHourAgo);
                    }
                    return prevHistory.filter(item => item.timestamp >= oneHourAgo);
                });
            }

            return newChain;
        });

        return nextIndex;
      });
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [niftyTicks, initialOptionChain, indices]);

  return (
    <>
      <StockRibbon stocks={indices} />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <MainContent indices={indices} optionChain={optionChain} maxPainHistory={maxPainHistory} />
      </main>
    </>
  );
}
