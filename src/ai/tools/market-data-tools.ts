'use server';

/**
 * @fileOverview A collection of tools for fetching financial market data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFiidiiData as fetchFiidiiData } from '@/services/market-data';
import type { Option } from '@/lib/types';

// FII/DII Data Tool
const FiiDiiDataSchema = z.object({
  date: z.string(),
  fii: z.object({
    buy: z.number(), sell: z.number(), net: z.number(),
  }),
  dii: z.object({
    buy: z.number(), sell: z.number(), net: z.number(),
  }),
});

export const getFiidiiData = ai.defineTool(
    {
        name: 'getFiidiiData',
        description: 'Gets the latest Foreign Institutional Investor (FII) and Domestic Institutional Investor (DII) activity data. Use this to understand market sentiment, especially for major indices like NIFTY 50 or SENSEX.',
        inputSchema: z.object({}),
        outputSchema: FiiDiiDataSchema,
    },
    async () => {
        return await fetchFiidiiData();
    }
);


// Option Chain Tool
const OptionSchema = z.object({
    strike: z.number(),
    ltp: z.number(),
    chng: z.number(),
    oi: z.number(),
    volume: z.number(),
});

const OptionChainSchema = z.object({
    underlyingPrice: z.number(),
    calls: z.array(OptionSchema),
    puts: z.array(OptionSchema),
});

export const getOptionChain = ai.defineTool(
    {
        name: 'getOptionChain',
        description: "Gets the current option chain data for a given stock symbol, providing call and put option details across various strike prices. Essential for understanding market expectations, support, and resistance levels for 'NIFTY 50'.",
        inputSchema: z.object({
            ticker: z.string().describe("The ticker symbol, e.g., 'NIFTY 50'"),
        }),
        outputSchema: OptionChainSchema,
    },
    async ({ ticker }) => {
        // In a real application, this would fetch live option chain data.
        // For this demo, we are generating a static, but realistic, sample.
        console.log(`Generating mock option chain for ${ticker}...`);
        
        const underlyingPrice = 24850; // Mock current price
        const strikes = [-200, -150, -100, -50, 0, 50, 100, 150, 200].map(offset => Math.round((underlyingPrice + offset) / 50) * 50);

        const generateOptions = (isCall: boolean): Omit<Option, 'bid' | 'ask' | 'prevLtp'>[] => {
            return strikes.map(strike => {
                const inTheMoney = isCall ? strike < underlyingPrice : strike > underlyingPrice;
                const intrinsicValue = isCall ? Math.max(0, underlyingPrice - strike) : Math.max(0, strike - underlyingPrice);
                const timeValue = Math.random() * 50 + 10;
                const ltp = intrinsicValue + timeValue;
                
                return {
                    strike,
                    ltp: parseFloat(ltp.toFixed(2)),
                    chng: parseFloat(((Math.random() - 0.5) * 20).toFixed(2)),
                    oi: (inTheMoney ? 50000 : 150000) + Math.floor(Math.random() * 50000),
                    volume: 1000000 + Math.floor(Math.random() * 1000000),
                };
            });
        };

        return {
            underlyingPrice,
            calls: generateOptions(true),
            puts: generateOptions(false),
        };
    }
);
