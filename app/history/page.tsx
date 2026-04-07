'use client';

import { useAlien } from '@alien-id/miniapps-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trophy, Skull, Medal } from 'lucide-react';
import Link from 'next/link';

interface Challenge {
  id: string;
  creatorAddress: string;
  joinerAddress: string | null;
  gameType: string;
  betAmount: number;
  creatorResult: number;
  joinerResult: number | null;
  winnerAddress: string | null;
  status: string;
  createdAt: string;
}

export default function History() {
  const { authToken } = useAlien();

  const { data: profile } = useQuery<{ alienId: string }>({
    queryKey: ['profile', authToken],
    queryFn: async () => {
      if (!authToken) throw new Error('Missing auth token');
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json();
    },
    enabled: !!authToken,
  });

  const myAddress = profile?.alienId;

  const { data: history, isLoading } = useQuery<Challenge[]>({
    queryKey: ['history', myAddress, authToken],
    queryFn: async () => {
      if (!authToken) return [];
      const res = await fetch('/api/history', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      return res.json();
    },
    enabled: !!authToken,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black italic tracking-tight uppercase">Battle History</h2>
        <p className="text-sm font-medium text-white/40">Review your past duels and earnings.</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 w-full bg-white/5 rounded-3xl animate-pulse" />
          ))
        ) : history && history.length > 0 ? (
          <AnimatePresence>
            {history.map((game, idx) => {
              const isCreator = game.creatorAddress === myAddress;
              const isWinner = game.winnerAddress === myAddress;
              const isPending = game.status === 'OPEN';

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-3xl border transition-all ${
                    isPending 
                    ? 'bg-white/5 border-white/5 opacity-60' 
                    : isWinner 
                      ? 'bg-blue-600/10 border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                      : 'bg-red-500/5 border-red-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isWinner ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/20'
                      }`}>
                        {isWinner ? <Medal /> : <Skull />}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            {game.gameType}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            {new Date(game.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-black italic ${isWinner ? 'text-blue-400' : 'text-white/60'}`}>
                            {isWinner ? '+' : '-'}{game.betAmount} ALIEN
                          </span>
                          {isPending && <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">Waiting</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Result</div>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] uppercase font-bold text-white/20">You</span>
                          <span className="font-mono font-bold text-sm">{isCreator ? game.creatorResult : (game.joinerResult || '?')}</span>
                        </div>
                        <span className="text-[10px] font-bold text-white/10 italic">vs</span>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] uppercase font-bold text-white/20">Opp</span>
                          <span className="font-mono font-bold text-sm">{isCreator ? (game.joinerResult || '?') : game.creatorResult}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-4">
             <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto opacity-20 rotate-45">
                <Clock className="w-8 h-8" />
             </div>
             <p className="text-sm font-bold text-white/40 uppercase tracking-widest leading-loose">The archives are empty.<br />Time to make history.</p>
             <Link href="/">
                <button className="px-8 py-3 bg-blue-600 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-lg">
                  Go Duel
                </button>
             </Link>
          </div>
        )}
      </div>

      {/* Quick Info */}
      {!isLoading && history && history.length > 0 && (
        <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center">
              <Trophy className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Win Rate</div>
              <div className="text-2xl font-black italic">
                {Math.round((history.filter(g => g.winnerAddress === myAddress).length / history.filter(g => g.status === 'FINISHED').length || 0) * 100)}%
              </div>
            </div>
          </div>
          <div className="text-right">
             <div className="text-xs font-bold text-white/20 uppercase tracking-widest">Total Earned</div>
             <div className="text-xl font-black text-white/40">
               {history.filter(g => g.winnerAddress === myAddress).reduce((acc, g) => acc + g.betAmount * 0.9, 0).toFixed(1)} ALIEN
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
