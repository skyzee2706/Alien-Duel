'use client';

import { useAlien, useHaptic, usePayment } from '@alien-id/miniapps-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice6, Trophy, Users, Zap, Clock, ChevronRight, Wallet, ArrowDownLeft, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface Challenge {
  id: string;
  creatorAddress: string;
  gameType: string;
  betAmount: number;
  status: string;
  createdAt: string;
}

export default function Lobby() {
  const { authToken } = useAlien();
  const { impactOccurred, notificationOccurred } = useHaptic();
  const { pay } = usePayment();
  const queryClient = useQueryClient();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [amount, setAmount] = useState('100');

  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: async () => {
      const res = await fetch('/api/challenges');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery<{ onlineCount: number, totalWinnersWinnings: string }>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', authToken],
    queryFn: async () => {
      if (!authToken) return null;
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      return res.json();
    },
    enabled: !!authToken,
  });

  const depositMutation = useMutation({
    mutationFn: async (val: string) => {
      impactOccurred('medium');
      // Trigger the official Alien Wallet payment flow
      await pay({
        amount: String(val),
        token: 'ALIEN',
        network: 'solana',
        invoice: `dep_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        recipient: process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || '',
      });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsDepositOpen(false);
      notificationOccurred('success');
      // Balance updates automatically via Webhook after confirmation
    }
  });

  const handleAmountClick = (val: string) => {
    setAmount(val);
    impactOccurred('light');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] p-6 bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-400/20 shadow-[0_20px_40px_rgba(37,99,235,0.3)]">
        <div className="relative z-10 flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-300 fill-blue-300" />
              <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Live Arena</span>
            </div>
            <h2 className="text-3xl font-black mb-1 leading-tight tracking-tighter italic uppercase text-white">
              BATTLE FOR <br />ALIEN TOKENS
            </h2>
            <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-[0.2em]">PvP Wagering Ecosystem</p>
          </div>
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.1 }}
            className="w-32 h-32 -mr-2 drop-shadow-[0_10px_30px_rgba(37,99,235,0.4)]"
          >
             <img src="/AlienDuel.png" alt="Alien Duel" className="w-full h-full object-contain" />
          </motion.div>
        </div>
        
        {/* Balance Bar inside Hero */}
        <div className="relative z-10 mt-6 p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
               <Wallet className="w-5 h-5 text-blue-300" />
             </div>
             <div>
               <div className="text-[8px] font-black text-blue-200 uppercase tracking-widest leading-none mb-1">Your Balance</div>
               <div className="text-lg font-black text-white italic leading-none">{profile?.balance?.toFixed(1) || '0.0'} <span className="text-[10px] font-bold opacity-60">ALIEN</span></div>
             </div>
           </div>
           <button 
            onClick={() => setIsDepositOpen(true)}
            className="p-2 px-4 bg-white text-blue-600 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
           >
             Deposit
           </button>
        </div>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Online</div>
            <div className="font-bold text-sm">{stats?.onlineCount || '...'}</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Winners</div>
            <div className="font-bold text-sm truncate max-w-[80px]">{stats?.totalWinnersWinnings || '0'}</div>
          </div>
        </div>
      </div>

      {/* Lobby List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Current Challenges</h3>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-24 w-full bg-white/5 rounded-2xl animate-pulse" />
            ))
          ) : challenges && challenges.length > 0 ? (
            <AnimatePresence>
              {challenges.map((challenge, idx) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/join/${challenge.id}`}>
                    <div className="group relative overflow-hidden p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1c2e] to-[#0d0f1a] border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-all">
                          {challenge.gameType === 'DICE' ? (
                            <Dice6 className="text-blue-400 w-8 h-8" />
                          ) : (
                            <Trophy className="text-blue-400 w-8 h-8" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">{challenge.gameType === 'DICE' ? 'Dice Duel' : 'Lucky Num'}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white italic tracking-tight">{challenge.betAmount}</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase">ALIEN</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pr-2">
                        <div className="text-right">
                           <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">Pool</div>
                           <div className="text-xs font-black text-blue-400 italic">{(challenge.betAmount * 1.8).toFixed(0)}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-3">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">No challenges yet</p>
              <Link href="/create">
                <button className="px-6 py-2 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Launch Challenge
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-50 flex justify-end px-6">
        <Link href="/create" className="pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-blue-600 rounded-full shadow-[0_15px_40px_rgba(37,99,235,0.6)] flex items-center justify-center border-4 border-[#0d1321] group active:scale-95 transition-all"
          >
            <Plus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-300" />
          </motion.button>
        </Link>
      </div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {isDepositOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm p-8 rounded-[2.5rem] bg-gradient-to-b from-[#141b2d] to-[#0d1321] border border-white/10 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                   <ArrowDownLeft className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Deposit ALIEN</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-8">Top up your game balance from your wallet.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black outline-none text-center text-4xl italic"
                  />
                  <div className="text-center text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-3">Balance will update instantly</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                   {['100', '500', '1000'].map(val => (
                    <button key={val} onClick={() => handleAmountClick(val)} className="p-3 bg-white/5 rounded-xl text-[10px] font-black hover:bg-white/10 transition-colors uppercase">
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsDepositOpen(false)} className="flex-1 p-4 rounded-xl bg-white/5 font-black uppercase tracking-widest text-[10px]">Cancel</button>
                <button 
                  onClick={() => depositMutation.mutate(amount)}
                  disabled={depositMutation.isPending}
                  className="flex-1 p-4 rounded-xl bg-blue-600 font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center"
                >
                  {depositMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Deposit'}
                </button>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
                  * Balance will update after confirmation <br /> from the Alien Network.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
