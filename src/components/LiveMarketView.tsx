'use client';

import { useState, useEffect } from 'react';
import { StockRibbon } from '@/components/StockRibbon';
import { MainContent } from '@/components/MainContent';
import { transformOption } from '@/lib/utils';
import type { Index, OptionChain, NiftyTick, RawOptionData } from '@/lib/types';

type LiveMarketViewProps = {
  initialIndices: Index[];
  initialOptionChain: OptionChain | null;
  niftyTicks: NiftyTick[];
  callsTicks: RawOptionData[];
  putsTicks: RawOptionData[];
};

export function LiveMarketView({ 
    initialIndices, 
    initialOptionChain, 
    niftyTicks,
    callsTicks,
    putsTicks,
}: LiveMarketViewProps) {
  const [indices, setIndices] = useState<Index[]>(initialIndices);
  const [optionChain, setOptionChain] = useState<OptionChain | null>(initialOptionChain);
  const [tickIndex, setTickIndex] = useState(0);

  useEffect(() => {
    const maxTicks = Math.max(niftyTicks.length, callsTicks.length, putsTicks.length);
    if (maxTicks === 0) return;

    const timer = setInterval(() => {
      setTickIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % maxTicks;

        // Update Nifty Index
        const currentNiftyTick = niftyTicks[nextIndex % niftyTicks.length];
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
        
        // Update Option Chain
        const currentCallTick = callsTicks[nextIndex % callsTicks.length];
        const currentPutTick = putsTicks[nextIndex % putsTicks.length];
        
        setOptionChain(prevChain => {
          if (!prevChain) return null;

          const newCall = currentCallTick ? transformOption(currentCallTick) : prevChain.calls[0];
          const newPut = currentPutTick ? transformOption(currentPutTick) : prevChain.puts[0];
          
          return {
            ...prevChain,
            underlyingPrice: indices.find(i => i.symbol === 'NIFTY 50')?.price || prevChain.underlyingPrice,
            calls: [{
                ...newCall,
                prevLtp: prevChain.calls[0]?.ltp
            }],
            puts: [{
                ...newPut,
                prevLtp: prevChain.puts[0]?.ltp
            }],
          };
        });

        return nextIndex;
      });
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [niftyTicks, callsTicks, putsTicks, indices]);

  return (
    <>
      <StockRibbon stocks={indices} />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <MainContent indices={indices} optionChain={optionChain} />
      </main>
    </>
  );
}
