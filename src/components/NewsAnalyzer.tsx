'use client';
import { useFormState, useFormStatus } from 'react-dom';
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
import { handleAnalyzeNews, type FormState } from '@/app/actions';
import { AlertCircle, Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Analyze Sentiment
    </Button>
  );
}

const initialState: FormState = {
  message: '',
};

export function NewsAnalyzer() {
  const [state, formAction] = useFormState(handleAnalyzeNews, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && state.message !== 'Analysis successful.') {
        toast({
            variant: "destructive",
            title: "Error",
            description: state.message,
        })
    }
    if (state.message === 'Analysis successful.') {
      formRef.current?.reset();
    }
  }, [state, toast]);


  const SentimentIndicator = ({ sentiment }: { sentiment?: string }) => {
    if (!sentiment) return null;
    const sentimentLower = sentiment.toLowerCase();

    if (sentimentLower === 'positive') {
      return <TrendingUp className="h-10 w-10 text-green-500" />;
    }
    if (sentimentLower === 'negative') {
      return <TrendingDown className="h-10 w-10 text-red-500" />;
    }
    return <Minus className="h-10 w-10 text-muted-foreground" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI News Analyzer</CardTitle>
        <CardDescription>Get AI-driven sentiment analysis on news affecting your stocks.</CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticker">Stock Ticker</Label>
            <Input id="ticker" name="ticker" placeholder="e.g., TSLA" required />
            {state.fields?.ticker && <p className="text-sm text-destructive">{state.fields.ticker}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsHeadline">News Headline</Label>
            <Input id="newsHeadline" name="newsHeadline" placeholder="Enter the news headline" required />
            {state.fields?.newsHeadline && <p className="text-sm text-destructive">{state.fields.newsHeadline}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsContent">News Content</Label>
            <Textarea id="newsContent" name="newsContent" placeholder="Paste the full news article content here" className="min-h-32" required/>
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
             state.result.sentiment.toLowerCase() === 'positive' && "border-green-500/50",
             state.result.sentiment.toLowerCase() === 'negative' && "border-red-500/50",
           )}>
            <div className="flex items-start gap-4">
                <SentimentIndicator sentiment={state.result.sentiment} />
                <div className="flex-1">
                    <AlertTitle className="text-lg capitalize">{state.result.sentiment} Sentiment</AlertTitle>
                    <AlertDescription className="mt-2 text-foreground/80">
                        {state.result.summary}
                    </AlertDescription>
                </div>
            </div>
           </Alert>
        </CardContent>
      )}
    </Card>
  );
}
