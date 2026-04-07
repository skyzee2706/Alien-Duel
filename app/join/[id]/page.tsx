'use client';

import { useAlien, useHaptic } from '@alien-id/miniapps-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice6, Trophy, Loader2, Zap, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function JoinChallenge() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authToken } = useAlien();
  const { impactOccurred, notificationOccurred } = useHaptic();

  const [isJoining, setIsJoining] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const { data: challenge, isLoading: isChallengeLoading } = useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const res = await fetch(`/api/challenges`);
      const all = await res.json();
      return all.find((c: any) => c.id === id);
    },
    enabled: !!id,
  });

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

  const handleJoin = async () => {
    if (!authToken) {
      setError('Alien Wallet not connected');
      return;
    }

    if (!profile || profile.balance < challenge.betAmount) {
      setError('Insufficient balance. Please deposit first.');
      return;
    }

    try {
      setIsJoining(true);
      setError(null);
      impactOccurred('medium');

      // 1. Trigger Join & Resolution
      const res = await fetch(`/api/challenges/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join');

      // 2. Start animation before showing result
      setShowAnimation(true);
      setTimeout(() => {
        setResult(data);
        setShowAnimation(false);
        setIsJoining(false);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        notificationOccurred(data.winner === authToken ? 'success' : 'error');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsJoining(false);
    }
  };

  if (isChallengeLoading) return <div className="p-12 text-center text-white/40 font-bold uppercase tracking-widest animate-pulse">Loading Battle...</div>;
  if (!challenge) return <div className="p-12 text-center text-white/40 font-bold uppercase tracking-widest">Challenge not found</div>;

  const isWinner = result?.winner === authToken;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
       <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Lobby</span>
      </Link>

      {result ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-8 py-12"
        >
          <div className={`relative inline-block p-1 bg-gradient-to-br ${isWinner ? 'from-green-400 to-green-600' : 'from-red-400 to-red-600'} rounded-[3rem] shadow-2xl`}>
            <div className="bg-[#0a0a0c] rounded-[2.8rem] p-12 space-y-6">
              <div className={`text-6xl font-black italic tracking-tighter ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                {isWinner ? 'YOU WON!' : 'YOU LOST'}
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Winnings</div>
                <div className="text-3xl font-black text-white italic">
                  {isWinner ? `+${(challenge.betAmount * 1.8).toFixed(1)}` : `-${challenge.betAmount}`} <span className="text-sm font-bold uppercase">ALIEN</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <button
              onClick={() => router.push('/')}
              className="w-full p-5 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest italic hover:bg-white/10 transition-all shadow-xl"
            >
              Back to Lobby
            </button>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Balance updated in your profile.</p>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="space-y-1">
            <h2 className="text-2xl font-black italic tracking-tight uppercase">Challenge Duel</h2>
            <p className="text-sm font-medium text-white/40">Roll against the creator to win the pool.</p>
          </div>

          {/* Verses Card */}
          <div className="relative p-8 rounded-[2.5rem] bg-white/5 border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-50">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="text-[10px] font-bold text-white/40 uppercase truncate max-w-[80px]">Creator</div>
              </div>

              <div className="text-center space-y-2">
                <div className="text-4xl font-black italic text-blue-500 scale-125">VS</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">Pool: {challenge.betAmount * 2} ALIEN</div>
              </div>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                  <Zap className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest italic">YOU</div>
              </div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Game Info */}
          <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                {challenge.gameType === 'DICE' ? <Dice6 className="text-white w-7 h-7" /> : <Trophy className="text-white w-7 h-7" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase">{challenge.gameType === 'DICE' ? 'Dice Duel' : 'Lucky Number'}</div>
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest italic">{challenge.gameType === 'DICE' ? 'Face: 1-6' : 'Face: 1-10'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Bet Amount</div>
              <div className="font-black italic text-white text-xl">{challenge.betAmount} <span className="text-[10px] font-bold uppercase">ALIEN</span></div>
            </div>
          </div>

          {/* Action Area */}
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

            {showAnimation ? (
              <div className="flex flex-col items-center justify-center gap-6 py-8">
                <div className="relative">
                   <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                    className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                  >
                    {challenge.gameType === 'DICE' ? <Dice6 className="text-white w-12 h-12" /> : <Trophy className="text-white w-12 h-12" />}
                  </motion.div>
                </div>
                <div className="text-sm font-black italic tracking-widest text-blue-400 uppercase animate-pulse">ROLLING FOR WINNER...</div>
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full relative overflow-hidden group p-5 rounded-3xl bg-blue-600 hover:bg-blue-500 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:scale-95"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <span className="text-lg font-black uppercase tracking-widest italic text-white shadow-sm">
                    {isJoining ? 'Resolving...' : 'Join & Battle'}
                  </span>
                  {isJoining ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 group-hover:fill-white transition-all" />}
                </div>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12" />
              </button>
            )}

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/20" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Your Balance:</span>
              </div>
              <span className="text-[10px] font-black italic text-white">{profile?.balance?.toFixed(1) || '0.0'} ALIEN</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
