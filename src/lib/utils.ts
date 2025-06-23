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
    // Mock change in OI if not present, as a small fraction of OI
    chngInOI: o.chngInOI ?? (o.OI || 0) * (Math.random() * 0.1 - 0.05),
    volume: o.ttq || 0,
    bid: o.bPrice || 0,
    ask: o.sPrice || 0,
});
