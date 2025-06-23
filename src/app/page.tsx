import { Header } from '@/components/Header';
import { StockRibbon } from '@/components/StockRibbon';
import { MainContent } from '@/components/MainContent';
import { loadIndicesData, loadOptionChainData } from '@/lib/data-loader';

export default async function Home() {
  const indices = await loadIndicesData();
  const nifty = indices.find(i => i.symbol === 'NIFTY 50');
  const optionChain = nifty ? await loadOptionChainData(nifty.price) : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <StockRibbon stocks={indices} />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <MainContent indices={indices} optionChain={optionChain} />
      </main>
      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        NiftyPulse &copy; {new Date().getFullYear()} - Financial data is for demonstration purposes only.
      </footer>
    </div>
  );
}
