import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export function DataInfo() {
  const useMock = !process.env.BREEZE_API_KEY || !process.env.BREEZE_SESSION_TOKEN;
  return (
    <Card className={useMock ? "bg-blue-900/20 border-blue-500/30" : "bg-green-900/20 border-green-500/30"}>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Lightbulb className={useMock ? "h-8 w-8 text-blue-400" : "h-8 w-8 text-green-400"} />
            <div className='flex-1'>
                <CardTitle>{useMock ? "Connect to Live Data" : "Live Data Connected"}</CardTitle>
                <CardDescription className="text-muted-foreground">
                    {useMock ? "Using simulated data. Connect to ICICI Breeze to go live." : "Receiving live data from ICICI Breeze API."}
                </CardDescription>
            </div>
        </CardHeader>
      <CardContent className="text-sm space-y-2">
        {useMock ? (
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
        ) : (
             <p>
                The application is successfully connected to the ICICI Breeze API and is fetching live market data. If you encounter issues, please verify your session token is still valid.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
