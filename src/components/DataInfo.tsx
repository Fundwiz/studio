import { CheckCircle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type DataInfoProps = {
  status: 'loading' | 'live' | 'mock';
  error?: string | null;
}

export function DataInfo({ status, error }: DataInfoProps) {
  if (status === 'loading') {
    return (
      <Alert className="border-blue-500/30 bg-blue-900/10">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
        <AlertTitle>Connecting...</AlertTitle>
        <AlertDescription>
          Attempting to connect to the live data feed.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'live') {
    return (
      <Alert className="border-green-500/30 bg-green-900/20">
        <CheckCircle className="h-4 w-4 text-green-400" />
        <AlertTitle>Live Data Connected</AlertTitle>
        <AlertDescription>
          The application is connected to the live data feed.
        </Description>
      </Alert>
    );
  }

  // Status is 'mock'
  return (
    <Alert className="border-yellow-500/30 bg-yellow-900/10">
      <Info className="h-4 w-4 text-yellow-400" />
      <AlertTitle>Demonstration Mode</AlertTitle>
      <AlertDescription>
        This website is running on high-quality simulated data. A live connection requires IP whitelisting in the financial data provider's developer portal, so the app has fallen back to a demonstration mode.
      </AlertDescription>
    </Alert>
  );
}
