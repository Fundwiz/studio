'use client';
import { useFormStatus } from 'react-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { handleAnalyzeMarketSentiment, type FormState } from '@/app/actions';
import { BrainCircuit, Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import { useEffect, useState, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Analyze Market
    </Button>
  );
}

const initialState: FormState = {
  message: '',
};

const sampleHeadline = "Economic Reforms and Strong GDP Growth Propel Nifty 50 to Record Highs";
const sampleContent = "India's benchmark Nifty 50 index surged to an all-time high today, driven by a wave of investor optimism following the announcement of significant economic reforms. The government's new policies, aimed at boosting manufacturing and simplifying tax structures, have been widely praised by market analysts. This, combined with a stronger-than-expected GDP growth forecast, has solidified confidence in the Indian market's trajectory. Foreign institutional investors have also shown renewed interest, with significant inflows recorded over the past week. Experts predict that if this momentum continues, the Nifty 50 could see further gains in the coming quarter.";

export function MarketSentimentAnalyzer() {
  const [state, formAction] = useActionState(handleAnalyzeMarketSentiment, initialState);
  const { toast } = useToast();

  const [ticker, setTicker] = useState('NIFTY 50');
  const [headline, setHeadline] = useState(sampleHeadline);
  const [content, setContent] = useState(sampleContent);

  useEffect(() => {
    if (!state.message) return; // Don't show toast on initial render
    
    if (state.message && state.message !== 'Analysis successful.') {
        toast({
            variant: "destructive",
            title: "Error",
            description: state.message,
        })
    }
  }, [state, toast]);


  const SentimentIndicator = ({ sentiment }: { sentiment?: string }) => {
    if (!sentiment) return null;
    const sentimentLower = sentiment.toLowerCase();

    if (sentimentLower === 'bullish') {
      return <TrendingUp className="h-10 w-10 text-green-500" />;
    }
    if (sentimentLower === 'bearish') {
      return <TrendingDown className="h-10 w-10 text-red-500" />;
    }
    return <Minus className="h-10 w-10 text-muted-foreground" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-accent"/>
            <CardTitle>AI Market Analyst</CardTitle>
        </div>
        <CardDescription>Get a holistic market analysis for NIFTY 50. The AI synthesizes news, option chain data, and FII/DII activity.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticker">Stock/Index Symbol</Label>
            <Input id="ticker" name="ticker" placeholder="e.g., NIFTY_50, RELIANCE" required value={ticker} onChange={(e) => setTicker(e.target.value)} />
            {state.fields?.ticker && <p className="text-sm text-destructive">{state.fields.ticker}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsHeadline">News Headline</Label>
            <Input id="newsHeadline" name="newsHeadline" placeholder="Enter the news headline" required value={headline} onChange={(e) => setHeadline(e.target.value)} />
            {state.fields?.newsHeadline && <p className="text-sm text-destructive">{state.fields.newsHeadline}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsContent">News Content</Label>
            <Textarea id="newsContent" name="newsContent" placeholder="Paste the full news article content here" className="min-h-32" required value={content} onChange={(e) => setContent(e.target.value)} />
            {state.fields?.newsContent && <p className="text-sm text-destructive">{state.fields.newsContent}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>

      {state.result && (
        <CardContent>
           <Alert className={cn(
             "border-2",
             state.result.overallSentiment.toLowerCase() === 'bullish' && "border-green-500/50",
             state.result.overallSentiment.toLowerCase() === 'bearish' && "border-red-500/50",
           )}>
            <div className="flex items-start gap-4">
                <SentimentIndicator sentiment={state.result.overallSentiment} />
                <div className="flex-1">
                    <AlertTitle className="text-lg capitalize">{state.result.overallSentiment} Sentiment</AlertTitle>
                    <AlertDescription className="mt-2 text-foreground/80 whitespace-pre-wrap">
                        {state.result.detailedAnalysis}
                    </AlertDescription>
                </div>
            </div>
           </Alert>
        </CardContent>
      )}
    </Card>
  );
}
