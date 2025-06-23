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
                    {error ? "Falling back to simulated data." : "Connect to ICICI Breeze to go live."}
                </CardDescription>
            </div>
        </CardHeader>
      <CardContent className="text-sm space-y-2">
        {error ? (
            <>
                <p className="font-semibold">The application could not connect to the live data feed. Here's the error and how to fix it:</p>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>API Error Details</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
                <p className="text-xs text-muted-foreground pt-4 font-bold">Common Troubleshooting Steps:</p>
                <ul className="list-disc space-y-2 pl-5 text-xs text-muted-foreground pt-2">
                    <li>
                        <strong>IP Whitelisting:</strong> The most common issue is that the Breeze API requires you to whitelist your server's IP address. Check your ICICI developer portal settings. Your local computer has a different IP than this server.
                    </li>
                    <li>
                        <strong>Expired Session Token:</strong> Session tokens are often short-lived. Please try regenerating a new session token from the Breeze API login page and updating it in the <code className="mx-1 p-1 rounded bg-muted font-mono text-xs">.env</code> file.
                    </li>
                    <li>
                        <strong>Incorrect Credentials:</strong> Double-check that the API Key and Secret in the <code className="mx-1 p-1 rounded bg-muted font-mono text-xs">.env</code> file are correct and have no extra spaces.
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
