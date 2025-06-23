import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Option, RawOptionData, OptionChain } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const transformOption = (o: RawOptionData): Option => ({
    strike: o.strike || 0,
    ltp: o.last || 0,
    chng: o.change || 0,
    oi: o.OI || 0,
    // Mock change in OI if not present, as a small fraction of OI
    chngInOI: o.chngInOI ?? (o.OI || 0) * (Math.random() * 0.1 - 0.05),
    volume: o.ttq || 0,
    bid: o.bPrice || 0,
    ask: o.sPrice || 0,
});

export function calculateMaxPain(optionChain: OptionChain | null) {
  if (!optionChain || !optionChain.calls.length || !optionChain.puts.length) {
    return { chartData: [], maxPainStrike: 0, strikes: [] };
  }

  const { calls, puts } = optionChain;
  const allStrikes = [...new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)])].sort((a, b) => a - b);
  
  if (allStrikes.length === 0) {
    return { chartData: [], maxPainStrike: 0, strikes: [] };
  }

  const payoffData = allStrikes.map(expiryStrike => {
    let totalPayoff = 0;

    // Calculate total loss for option writers (which is option buyers' gain)
    calls.forEach(call => {
      if (call.strike < expiryStrike) {
        totalPayoff += (expiryStrike - call.strike) * call.oi;
      }
    });

    puts.forEach(put => {
      if (put.strike > expiryStrike) {
        totalPayoff += (put.strike - expiryStrike) * put.oi;
      }
    });

    return { strike: expiryStrike, payoff: totalPayoff };
  });

  let minPayoff = Infinity;
  let maxPainStrike = 0;
  payoffData.forEach(item => {
    if (item.payoff < minPayoff) {
      minPayoff = item.payoff;
      maxPainStrike = item.strike;
    }
  });

  return { chartData: payoffData, maxPainStrike, strikes: allStrikes };
}
