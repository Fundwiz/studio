import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export function DataInfo() {
  return (
    <Card className="bg-blue-900/20 border-blue-500/30">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Lightbulb className="h-8 w-8 text-blue-400" />
            <div className='flex-1'>
                <CardTitle>Using Your Own Data</CardTitle>
                <CardDescription className="text-muted-foreground">How to connect to a live data feed.</CardDescription>
            </div>
        </CardHeader>
      <CardContent className="text-sm space-y-2">
        <p>
            This app is currently running on <span className="font-semibold text-primary">simulated data</span>.
        </p>
        <p>
          To connect to a live financial data source, you'll need to modify the functions in the
          <code className="mx-1 p-1 rounded bg-muted font-mono text-xs">src/lib/api.ts</code> file.
          This involves integrating an API from a provider like Zerodha, Angel One, or another financial data vendor.
        </p>
      </CardContent>
    </Card>
  );
}
