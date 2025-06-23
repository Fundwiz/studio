'use server';
import { z } from 'zod';
import {
  analyzeNewsSentiment,
  type AnalyzeNewsSentimentOutput,
} from '@/ai/flows/analyze-news-sentiment';

const FormSchema = z.object({
  ticker: z.string().min(1, 'Ticker symbol is required.'),
  newsHeadline: z.string().min(10, 'Headline must be at least 10 characters.'),
  newsContent: z.string().min(50, 'News content must be at least 50 characters.'),
});

export type FormState = {
  message: string;
  fields?: Record<string, string>;
  result?: AnalyzeNewsSentimentOutput;
};

export async function handleAnalyzeNews(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = FormSchema.safeParse({
    ticker: formData.get('ticker'),
    newsHeadline: formData.get('newsHeadline'),
    newsContent: formData.get('newsContent'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check your inputs.',
      fields: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await analyzeNewsSentiment(validatedFields.data);
    return {
      message: 'Analysis successful.',
      result,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'An error occurred during analysis. Please try again.',
    };
  }
}
