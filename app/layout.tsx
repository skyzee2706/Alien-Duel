import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Alien Duel | PvP Wager Game",
  description: "Asynchronous PvP wagering mini app inside Alien Network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${outfit.className} bg-[#0a0a0c] text-white min-h-screen selection:bg-blue-500/30 overflow-x-hidden`}>
        <Providers>
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative border-x border-white/5 bg-gradient-to-b from-[#0a0a0c] to-[#0d1321]">
            <header className="px-4 py-3 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0a0a0c]/80 backdrop-blur-md z-50">
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <img 
                    src="/AlienDuel.png" 
                    alt="Alien Duel Logo" 
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                  />
                </div>
                <h1 className="text-lg font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-blue-600 leading-none">
                  Alien Duel
                </h1>
              </div>
              <div className="p-1 px-3 bg-white/5 rounded-full border border-white/10 text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Alien Wallet
              </div>
            </header>
            
            <main className="flex-1 p-4 pb-24">
              {children}
            </main>

            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#0a0a0c]/90 backdrop-blur-lg border-t border-white/5 p-4 flex justify-around items-center z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
              <a href="/" className="flex flex-col items-center gap-1 group">
                <div className="p-2 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <span className="text-[10px] font-medium text-blue-400 uppercase tracking-widest">Lobby</span>
              </a>
              <a href="/history" className="flex flex-col items-center gap-1 group">
                <div className="p-2 rounded-xl group-hover:bg-white/5 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">History</span>
              </a>
              <a href="/history" className="flex flex-col items-center gap-1 group">
                <div className="p-2 rounded-xl group-hover:bg-white/5 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">History</span>
              </a>
            </nav>
          </div>
        </Providers>
      </body>
    </html>
  );
}
