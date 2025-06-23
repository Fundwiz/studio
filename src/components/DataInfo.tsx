"use client";
import { CheckCircle, Info, Loader2 } from 'lucide-react';
import * as AlertComponents from './ui/alert';

type DataInfoProps = {
  status: 'loading' | 'live' | 'mock';
};

export function DataInfo({ status }: DataInfoProps) {
  if (status === 'loading') {
    return (
      <AlertComponents.Alert className="border-blue-500/30 bg-blue-900/10">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
        <AlertComponents.AlertTitle>Connecting...</AlertComponents.AlertTitle>
        <AlertComponents.AlertDescription>
          Attempting to connect to the live data feed.
        </AlertComponents.AlertDescription>
      </AlertComponents.Alert>
    );
  }

  if (status === 'live') {
    return (
      <AlertComponents.Alert className="border-green-500/30 bg-green-900/20">
        <CheckCircle className="h-4 w-4 text-green-400" />
        <AlertComponents.AlertTitle>Live Data Connected</AlertComponents.AlertTitle>
        <AlertComponents.AlertDescription>
          The application is connected to the live data feed.
        </AlertComponents.AlertDescription>
      </AlertComponents.Alert>
    );
  }

  // Status is 'mock'
  return (
    <AlertComponents.Alert className="border-yellow-500/30 bg-yellow-900/10">
      <Info className="h-4 w-4 text-yellow-400" />
      <AlertComponents.AlertTitle>Demonstration Mode</AlertComponents.AlertTitle>
      <AlertComponents.AlertDescription>
        This website is running on high-quality simulated data. A live connection requires IP whitelisting in the financial data provider's developer portal, so the app has fallen back to a demonstration mode.
      </AlertComponents.AlertDescription>
    </AlertComponents.Alert>
  );
}
