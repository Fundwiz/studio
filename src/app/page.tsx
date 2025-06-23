import { Header } from '@/components/Header';
import { loadIndicesData, loadOptionChainData, loadAllNiftyTicks, loadAllCallsTicks, loadAllPutsTicks } from '@/lib/data-loader';
import { LiveMarketView } from '@/components/LiveMarketView';

export default async function Home() {
  const initialIndices = await loadIndicesData();
  const optionChain = await loadOptionChainData(initialIndices.find(i => i.symbol === 'NIFTY 50')?.price || 0);
  const niftyTicks = await loadAllNiftyTicks();
  const callsTicks = await loadAllCallsTicks();
  const putsTicks = await loadAllPutsTicks();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <LiveMarketView 
        initialIndices={initialIndices}
        initialOptionChain={optionChain}
        niftyTicks={niftyTicks}
        callsTicks={callsTicks}
        putsTicks={putsTicks}
      />
      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        NiftyPulse &copy; {new Date().getFullYear()} - Financial data is for demonstration purposes only.
      </footer>
    </div>
  );
}
