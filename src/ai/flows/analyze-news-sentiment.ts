'use server';

/**
 * @fileOverview A market sentiment analysis AI agent that synthesizes news, option chain data, and institutional investor data.
 *
 * - analyzeMarketSentiment - A function that provides a holistic market sentiment analysis.
 * - AnalyzeMarketSentimentInput - The input type for the function.
 * - AnalyzeMarketSentimentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFiidiiData, getOptionChain } from '@/ai/tools/market-data-tools';

// Input Schema
const AnalyzeMarketSentimentInputSchema = z.object({
  ticker: z.string().describe('The ticker symbol of the stock/index, e.g., NIFTY 50.'),
  newsHeadline: z.string().describe('The headline of the news article.'),
  newsContent: z.string().describe('The content of the news article.'),
});
export type AnalyzeMarketSentimentInput = z.infer<typeof AnalyzeMarketSentimentInputSchema>;


// Output Schema
const AnalyzeMarketSentimentOutputSchema = z.object({
  overallSentiment: z
    .string()
    .describe(
      'A single-word overall sentiment (e.g., Bullish, Bearish, Neutral, Volatile) based on all available data.'
    ),
  detailedAnalysis: z
    .string()
    .describe('A detailed analysis synthesizing the news, option chain data, and FII/DII data to justify the overall sentiment.'),
});
export type AnalyzeMarketSentimentOutput = z.infer<typeof AnalyzeMarketSentimentOutputSchema>;


// The exported wrapper function that calls the flow
export async function analyzeMarketSentiment(
  input: AnalyzeMarketSentimentInput
): Promise<AnalyzeMarketSentimentOutput> {
  return analyzeMarketSentimentFlow(input);
}


// The prompt definition
const prompt = ai.definePrompt({
  name: 'marketSentimentPrompt',
  input: {schema: AnalyzeMarketSentimentInputSchema},
  output: {schema: AnalyzeMarketSentimentOutputSchema},
  tools: [getOptionChain, getFiidiiData],
  prompt: `You are an expert financial analyst for the Indian stock market, specializing in the NIFTY 50 index. Your task is to provide a holistic market sentiment analysis.

To do this, you must synthesize information from three sources:
1.  **News Analysis**: Analyze the provided news headline and content for its impact on the specified ticker.
2.  **Option Chain Analysis**: Use the 'getOptionChain' tool to fetch the current option chain data. Analyze the Open Interest (OI) at various strike prices to identify key support and resistance levels. A high Put-Call Ratio (total Put OI / total Call OI) is generally bullish.
3.  **Institutional Activity**: Use the 'getFiidiiData' tool to get the latest Foreign and Domestic Institutional Investor data. Net positive FII/DII inflow is a bullish signal.

Combine your findings from all three sources to determine an 'overallSentiment' and write a 'detailedAnalysis' that explains your reasoning. Your analysis should be comprehensive, referencing specific data points from the tools and the news.

**Ticker Symbol**: {{{ticker}}}
**News Headline**: {{{newsHeadline}}}
**News Content**: {{{newsContent}}}
`,
});

// The main flow definition
const analyzeMarketSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeMarketSentimentFlow',
    inputSchema: AnalyzeMarketSentimentInputSchema,
    outputSchema: AnalyzeMarketSentimentOutputSchema,
  },
  async input => {
    // Only run for NIFTY 50 as requested and as tools are mocked for it
    if (input.ticker.toUpperCase() !== 'NIFTY 50') {
        return {
            overallSentiment: 'Unavailable',
            detailedAnalysis: "This advanced analysis is currently available only for 'NIFTY 50'. The provided tools are configured to fetch data specifically for this index."
        };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
