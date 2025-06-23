"use client";
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function DataInfo() {
  return (
    <Alert className="border-blue-500/30 bg-blue-900/10">
      <Info className="h-4 w-4 text-blue-400" />
      <AlertTitle>Demonstration Mode</AlertTitle>
      <AlertDescription>
        This application is running with static sample data from CSV files. You can provide your own historical data by editing the 
        <code className='mx-1 p-1 text-xs bg-muted rounded-sm'>src/data/nifty_tick.csv</code>, 
        <code className='mx-1 p-1 text-xs bg-muted rounded-sm'>src/data/calls.csv</code>, and
        <code className='mx-1 p-1 text-xs bg-muted rounded-sm'>src/data/puts.csv</code> files.
      </AlertDescription>
    </Alert>
  );
}
