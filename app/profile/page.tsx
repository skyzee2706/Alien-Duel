'use client';

import { useAlien, useHaptic } from '@alien-id/miniapps-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Edit2, Save, Wallet, ArrowUpRight, ArrowDownLeft, History, Loader2, LogOut } from 'lucide-react';

export default function Profile() {
  const { authToken } = useAlien();
  const { impactOccurred, notificationOccurred } = useHaptic();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('100');

  const { data: profile, isLoading: isProfileLoading } = useQuery({
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

  const { data: transactions } = useQuery({
    queryKey: ['transactions', authToken],
    queryFn: async () => {
      if (!authToken) return null;
      const res = await fetch('/api/transactions', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      return res.json();
    },
    enabled: !!authToken,
  });

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (newUsername: string) => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username: newUsername }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      notificationOccurred('success');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (val: string) => {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ amount: val }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsWithdrawOpen(false);
      notificationOccurred('success');
    },
    onError: (err: any) => {
      alert(err.message);
      notificationOccurred('error');
    }
  });

  const handleSave = () => {
    if (username.trim()) {
      updateProfile.mutate(username.trim());
      impactOccurred('medium');
    }
  };

  if (isProfileLoading) return <div className="p-12 text-center text-white/40 font-bold uppercase tracking-widest animate-pulse">Scanning Profile...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <h2 className="text-2xl font-black italic tracking-tight uppercase">User Profile</h2>
        <p className="text-sm font-medium text-white/40">Withdraw your winnings and check history.</p>
      </div>

      {/* Simplified Balance Card - Only Withdraw here */}
      <div className="relative overflow-hidden p-6 rounded-[2rem] bg-white/5 border border-white/5 shadow-xl">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Withdrawable Balance</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black italic tracking-tighter text-white">
                  {profile?.balance?.toFixed(1) || '0.0'}
                </span>
                <span className="text-sm font-bold text-white/20 uppercase tracking-widest leading-none">ALIEN</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center backdrop-blur-md border border-blue-500/20">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          <button 
            onClick={() => setIsWithdrawOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg"
          >
            <ArrowUpRight className="w-5 h-5" /> Withdraw to Wallet
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            {isEditing ? (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/5 border border-blue-500/50 rounded-lg p-2 text-sm font-bold text-white outline-none w-32"
                autoFocus
              />
            ) : (
              <div>
                <div className="text-[10px] font-bold uppercase text-white/40">Username</div>
                <div className="font-black italic text-white uppercase">{profile?.username || 'New Alien'}</div>
              </div>
            )}
          </div>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {isEditing ? <Save className="w-4 h-4 text-blue-400" /> : <Edit2 className="w-4 h-4 text-white/40" />}
          </button>
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="text-[10px] font-bold uppercase text-white/40 mb-1">Alien Wallet Address</div>
          <div className="text-[10px] font-mono text-white/60 truncate bg-white/5 p-2 rounded-lg">{profile?.alienId}</div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <History className="w-4 h-4 text-white/40" />
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Transaction Log</h3>
        </div>

        <div className="space-y-2">
          {transactions?.map((tx: any) => (
            <div key={tx.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.type === 'DEPOSIT' || tx.type === 'WIN' 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-red-500/10 text-red-400'
                }`}>
                  {tx.type === 'DEPOSIT' || tx.type === 'WIN' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-tighter">{tx.type}</div>
                  <div className="text-[8px] text-white/30 font-bold uppercase">{new Date(tx.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className={`text-lg font-black italic ${
                tx.type === 'DEPOSIT' || tx.type === 'WIN' ? 'text-green-400' : 'text-white'
              }`}>
                {tx.type === 'DEPOSIT' || tx.type === 'WIN' ? '+' : '-'}{tx.amount}
              </div>
            </div>
          ))}
          {!transactions?.length && (
            <div className="p-8 text-center text-white/20 text-xs font-bold uppercase tracking-widest italic py-12">
              Memory bank empty
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm p-8 rounded-[2.5rem] bg-[#0d0f1a] border border-white/10 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <ArrowUpRight className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Withdraw Funds</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-8 leading-relaxed">Liquidate your game balance back to your personal wallet.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black italic outline-none text-center text-4xl"
                  />
                  <div className="text-center text-[10px] font-black text-white/20 uppercase tracking-widest mt-3">
                    Available: {profile?.balance?.toFixed(1)} ALIEN
                  </div>
                </div>
                <div className="text-center text-[10px] font-black text-red-400/60 uppercase tracking-widest italic animate-pulse">
                  Minimum: 1 ALIEN
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setIsWithdrawOpen(false)} className="flex-1 p-4 rounded-xl bg-white/5 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors">Abort</button>
                <button 
                  onClick={() => withdrawMutation.mutate(amount)}
                  disabled={withdrawMutation.isPending}
                  className="flex-1 p-4 rounded-xl bg-red-600 font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-red-500 transition-colors flex items-center justify-center"
                >
                   {withdrawMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Execute Withdrawal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
