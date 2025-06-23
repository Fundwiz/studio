"use client";
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function DataInfo() {
  return (
    <Alert className="border-blue-500/30 bg-blue-900/10">
      <Info className="h-4 w-4 text-blue-400" />
      <AlertTitle>Demonstration Mode</AlertTitle>
      <AlertDescription>
        This application is running with static sample data. You can provide your own historical data by editing the contents of `src/lib/mock-data.ts`.
      </AlertDescription>
    </Alert>
  );
}
