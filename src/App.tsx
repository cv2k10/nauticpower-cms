import { useEffect, useState } from "react";
import { CmsProvider } from "./cms/store";
import { useHashRoute } from "./router";
import type { TradeId } from "./cms/content";
import { ToastProvider } from "./admin/ui";
import { AdminApp } from "./admin/AdminApp";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { StatsBand, TickerBand } from "./components/Bands";
import { Overview } from "./components/Overview";
import { Trades } from "./components/Trades";
import { Coverage } from "./components/Coverage";
import { CtaBand } from "./components/CtaBand";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { scrollToId } from "./components/motion";

const Site = () => {
  const [selectedTrades, setSelectedTrades] = useState<TradeId[]>(["fabrication"]);

  const handleEnquireTrade = (trade: TradeId) => {
    setSelectedTrades([trade]);
    scrollToId("contact");
  };

  const handleToggleTrade = (trade: TradeId) =>
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((id) => id !== trade) : [...prev, trade]
    );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <div id="stats" className="scroll-mt-20">
          <StatsBand />
        </div>
        <TickerBand />
        <Overview onEnquireTrade={handleEnquireTrade} />
        <Trades onEnquireTrade={handleEnquireTrade} />
        <Coverage />
        <CtaBand />
        <Contact selectedTrades={selectedTrades} onToggleTrade={handleToggleTrade} />
      </main>
      <Footer />
    </div>
  );
};

const Routes = () => {
  const [path, navigate] = useHashRoute();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [path]);

  if (path.startsWith("/admin")) return <AdminApp path={path} navigate={navigate} />;
  return <Site />;
};

export function App() {
  return (
    <CmsProvider>
      <ToastProvider>
        <Routes />
      </ToastProvider>
    </CmsProvider>
  );
}

export default App;
