'use server';

/**
 * @fileOverview A news sentiment analysis AI agent.
 *
 * - analyzeNewsSentiment - A function that handles the news sentiment analysis process.
 * - AnalyzeNewsSentimentInput - The input type for the analyzeNewsSentiment function.
 * - AnalyzeNewsSentimentOutput - The return type for the analyzeNewsSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFiidiiData } from '@/services/market-data';

const AnalyzeNewsSentimentInputSchema = z.object({
  ticker: z.string().describe('The ticker symbol of the stock.'),
  newsHeadline: z.string().describe('The headline of the news article.'),
  newsContent: z.string().describe('The content of the news article.'),
});
export type AnalyzeNewsSentimentInput = z.infer<typeof AnalyzeNewsSentimentInputSchema>;

const AnalyzeNewsSentimentOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The sentiment of the news article (positive, negative, or neutral) toward the stock.'
    ),
  summary: z
    .string()
    .describe('A brief summary of the news article and its potential impact on the stock. If FII/DII data is available, include its impact in the summary.'),
});
export type AnalyzeNewsSentimentOutput = z.infer<typeof AnalyzeNewsSentimentOutputSchema>;

const FiiDiiDataSchema = z.object({
  date: z.string(),
  fii: z.object({
    buy: z.number(),
    sell: z.number(),
    net: z.number(),
  }),
  dii: z.object({
    buy: z.number(),
    sell: z.number(),
    net: z.number(),
  }),
});

const getLatestFiidiiDataTool = ai.defineTool(
    {
        name: 'getLatestFiidiiData',
        description: 'Gets the latest Foreign Institutional Investor (FII) and Domestic Institutional Investor (DII) activity data. Use this to understand market sentiment, especially for major indices like NIFTY 50 or SENSEX.',
        inputSchema: z.object({}),
        outputSchema: FiiDiiDataSchema,
    },
    async () => {
        return await getFiidiiData();
    }
);


export async function analyzeNewsSentiment(
  input: AnalyzeNewsSentimentInput
): Promise<AnalyzeNewsSentimentOutput> {
  return analyzeNewsSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeNewsSentimentPrompt',
  input: {schema: AnalyzeNewsSentimentInputSchema},
  output: {schema: AnalyzeNewsSentimentOutputSchema},
  tools: [getLatestFiidiiDataTool],
  prompt: `You are a financial analyst who specializes in understanding the impact of news on stock prices.

You will be provided with a news headline and content related to a specific stock ticker.
Your task is to analyze the sentiment of the news (positive, negative, or neutral) toward the stock and provide a brief summary of the news article and its potential impact on the stock.

When analyzing a major market index like 'NIFTY 50' or 'SENSEX', you MUST use the \`getLatestFiidiiData\` tool to fetch the latest institutional investor activity and include its impact in your summary.

Ticker Symbol: {{{ticker}}}
News Headline: {{{newsHeadline}}}
News Content: {{{newsContent}}}

Sentiment: 
Summary: `,
});

const analyzeNewsSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeNewsSentimentFlow',
    inputSchema: AnalyzeNewsSentimentInputSchema,
    outputSchema: AnalyzeNewsSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
