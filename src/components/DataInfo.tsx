import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type DataInfoProps = {
  status: 'loading' | 'live' | 'mock';
  error?: string | null;
}

export function DataInfo({ status, error }: DataInfoProps) {
  if (status === 'loading') {
    return (
        <Card className="bg-blue-900/20 border-blue-500/30">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Lightbulb className="h-8 w-8 text-blue-400" />
                <div className='flex-1'>
                    <CardTitle>Connecting...</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Attempting to connect to live data feed.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
  }

  if (status === 'live') {
      return (
        <Card className="bg-green-900/20 border-green-500/30">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <div className='flex-1'>
                    <CardTitle>Live Data Connected</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Receiving live data from ICICI Breeze API.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
      );
  }

  // Status is 'mock'
  return (
    <Card className={error ? "bg-destructive/20 border-destructive/30" : "bg-blue-900/20 border-blue-500/30"}>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            {error ? <AlertTriangle className="h-8 w-8 text-destructive" /> : <Lightbulb className="h-8 w-8 text-blue-400" />}
            <div className='flex-1'>
                <CardTitle>{error ? "Connection Failed" : "Using Simulated Data"}</CardTitle>
                <CardDescription className="text-muted-foreground">
                    {error ? "Falling back to high-quality simulated data." : "Connect to ICICI Breeze to go live."}
                </CardDescription>
            </div>
        </CardHeader>
      <CardContent className="text-sm space-y-2">
        {error ? (
            <>
                <p className="font-semibold">The application could not connect to the live data feed, which is common when running in a new server environment.</p>
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Most Likely Cause: IP Whitelisting</AlertTitle>
                    <AlertDescription>
                        Your credentials worked locally, which proves they are correct. The error <code className="mx-1 p-1 rounded bg-muted font-mono text-xs">{error}</code> almost always means the ICICI API is blocking the connection because it's coming from an unrecognized server IP address.
                    </AlertDescription>
                </Alert>
                <p className="text-xs text-muted-foreground pt-4 font-bold">What to do:</p>
                <ul className="list-disc space-y-2 pl-5 text-xs text-muted-foreground pt-2">
                    <li>
                        <strong>The Solution:</strong> To fix this, you must add this server's IP address to the whitelist in your ICICI developer portal.
                    </li>
                    <li>
                        <strong>The Challenge:</strong> Unfortunately, I cannot provide you with the server's IP address, and you've mentioned you don't have access to the portal. Without this step, a live connection is not possible.
                    </li>
                     <li>
                        <strong>Moving Forward:</strong> The application has fallen back to a high-quality simulated data mode. You can continue to use all application features with this realistic mock data.
                    </li>
                </ul>
            </>
        ) : (
            <>
                <p>
                    This app is configured to use the <span className="font-semibold text-primary">ICICI Breeze API</span> but is currently running on simulated data because your credentials aren't set.
                </p>
                <p>
                  To connect to the live data feed, open the <code className="mx-1 p-1 rounded bg-muted font-mono text-xs">.env</code> file in the project and enter your <code className="mx-1 p-1 rounded bg-muted font-mono text-xs">BREEZE_API_KEY</code>, <code className="mx-1 p-1 rounded bg-muted font-mono text-xs">BREEZE_API_SECRET</code>, and <code className="mx-1 p-1 rounded bg-muted font-mono text-xs">BREEZE_SESSION_TOKEN</code>.
                </p>
                 <p className="text-xs text-muted-foreground pt-2">
                    Note: You are responsible for managing your API keys and session token lifecycle. Session tokens expire and must be regenerated according to the Breeze API documentation.
                </p>
            </>
        )}
      </CardContent>
    </Card>
  );
}
