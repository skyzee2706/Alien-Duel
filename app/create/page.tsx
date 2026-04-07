'use client';

import { useAlien, useHaptic } from '@alien-id/miniapps-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice6, Trophy, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const GAME_TYPES = [
  { id: 'DICE', name: 'Dice Duel', icon: Dice6, range: '1-6', color: 'from-blue-500 to-blue-700' },
  { id: 'LUCKY_NUMBER', name: 'Lucky Number', icon: Trophy, range: '1-10', color: 'from-indigo-500 to-indigo-700' },
];

const BET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

export default function CreateChallenge() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authToken } = useAlien();
  const { impactOccurred, notificationOccurred } = useHaptic();
  
  const [gameType, setGameType] = useState('DICE');
  const [betAmount, setBetAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile', authToken],
    queryFn: async () => {
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      return res.json();
    },
    enabled: !!authToken,
  });

  const handleCreate = async () => {
    if (!authToken) {
      setError('Alien Wallet not connected');
      return;
    }

    const finalAmount = isCustom ? Number(customAmount) : betAmount;

    if (isNaN(finalAmount) || finalAmount < 100) {
      setError('Minimum bet is 100 ALIEN');
      return;
    }

    if (!profile || profile.balance < finalAmount) {
      setError('Insufficient balance. Please deposit first.');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      impactOccurred('medium');

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ gameType, betAmount: finalAmount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create challenge');

      notificationOccurred('success');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <h2 className="text-2xl font-black italic tracking-tight uppercase">Create Challenge</h2>
        <p className="text-sm font-medium text-white/40">Use your internal balance to wager.</p>
      </div>

      {/* Balance Preview */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Check className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Your Balance</span>
        </div>
        <div className="font-black italic text-white">{profile?.balance?.toFixed(1) || '0.0'} ALIEN</div>
      </div>

      {/* Game Type Selection */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Game Type</label>
        <div className="grid grid-cols-2 gap-4">
          {GAME_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => { setGameType(type.id); impactOccurred('light'); }}
              className={`relative overflow-hidden p-4 rounded-3xl border-2 transition-all text-left ${
                gameType === type.id 
                ? 'bg-white/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]' 
                : 'bg-white/5 border-transparent opacity-60'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}>
                <type.icon className="w-6 h-6 text-white" />
              </div>
              <div className="font-bold text-sm mb-1">{type.name}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{type.range}</div>
              
              {gameType === type.id && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Bet Amount (ALIEN)</label>
        <div className="grid grid-cols-3 gap-3">
          {BET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => { 
                setBetAmount(amount); 
                setIsCustom(false);
                impactOccurred('light'); 
              }}
              className={`p-3 rounded-2xl border-2 font-black transition-all ${
                !isCustom && betAmount === amount 
                ? 'bg-blue-600 border-blue-400 shadow-lg scale-105' 
                : 'bg-white/5 border-transparent text-white/40'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>

        <div className="relative mt-2">
          <input
            type="number"
            placeholder="Custom Amount (Min 100)"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setIsCustom(true);
            }}
            onFocus={() => setIsCustom(true)}
            className={`w-full p-4 rounded-2xl bg-white/5 border-2 transition-all font-bold placeholder:text-white/20 outline-none ${
              isCustom ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent text-white/40'
            }`}
          />
          {isCustom && <div className="absolute top-4 right-4 text-[10px] font-bold text-blue-400 uppercase tracking-widest">Custom</div>}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm font-bold"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full relative overflow-hidden group p-5 rounded-3xl bg-blue-600 hover:bg-blue-500 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:scale-95"
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            <span className="text-lg font-black uppercase tracking-widest italic text-white shadow-sm">
              {isCreating ? 'Creating...' : 'Launch Challenge'}
            </span>
            {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
          </div>
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12" />
        </button>
        
        <p className="text-[10px] text-center font-bold text-white/20 uppercase tracking-widest">
          Balance will be deducted immediately.
        </p>
      </div>
    </div>
  );
}
