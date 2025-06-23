import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Option, RawOptionData } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const transformOption = (o: RawOptionData): Option => ({
    strike: o.strike || 0,
    ltp: o.last || 0,
    chng: o.change || 0,
    oi: o.OI || 0,
    volume: o.ttq || 0,
    bid: o.bPrice || 0,
    ask: o.sPrice || 0,
});
