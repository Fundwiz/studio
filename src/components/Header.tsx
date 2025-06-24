import { Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="p-4 border-b">
      <div className="container mx-auto">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            TickerSpark
          </h1>
        </div>
      </div>
    </header>
  );
}
