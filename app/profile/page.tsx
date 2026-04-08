'use client';

import { useMemo, useState } from 'react';
import { useAlien, useHaptic } from '@alien-id/miniapps-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Loader2, UserRound, Wallet, IdCard, History, PencilLine } from 'lucide-react';

type UserProfile = {
  id: string;
  alienId: string;
  username: string | null;
  balance: number;
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

const MIN_CHALLENGE_BALANCE = 100;

function shortenIdentity(value: string) {
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function ProfilePage() {
  const { authToken } = useAlien();
  const { impactOccurred, notificationOccurred } = useHaptic();
  const queryClient = useQueryClient();

  const [usernameDraft, setUsernameDraft] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['profile', authToken],
    queryFn: async () => {
      if (!authToken) return null;
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        throw new Error('Failed to load profile');
      }
      return res.json();
    },
    enabled: !!authToken,
    refetchInterval: authToken ? 5000 : false,
    refetchIntervalInBackground: true,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', authToken],
    queryFn: async () => {
      if (!authToken) return [];
      const res = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        throw new Error('Failed to load transactions');
      }
      return res.json();
    },
    enabled: !!authToken,
    refetchInterval: authToken ? 5000 : false,
    refetchIntervalInBackground: true,
  });

  const saveUsernameMutation = useMutation({
    mutationFn: async (nextUsername: string) => {
      if (!authToken) {
        throw new Error('Missing auth token');
      }

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username: nextUsername }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update username');
      }

      return data as UserProfile;
    },
    onSuccess: () => {
      notificationOccurred('success');
      setUsernameDraft(null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update username';
      notificationOccurred('error');
      alert(message);
    },
  });

  const balance = profile?.balance ?? 0;
  const username = usernameDraft ?? (profile?.username ?? '');
  const challengeHint = useMemo(() => {
    if (balance <= 0) {
      return 'No internal balance is available yet.';
    }
    if (balance < MIN_CHALLENGE_BALANCE) {
      return `Your deposit has arrived, but it is still below the ${MIN_CHALLENGE_BALANCE} ALIEN minimum required to create a challenge.`;
    }
    return 'Your internal balance is ready to create a new challenge.';
  }, [balance]);

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      impactOccurred('light');
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      notificationOccurred('error');
    }
  };

  if (!authToken) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-white/60">
        Connect your Alien account to view profile details.
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-[#11182b] to-blue-950 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">
              Player Profile
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
              {profile.username || 'Unnamed Player'}
            </h2>
            <p className="text-sm font-medium text-white/55">
              This data is loaded from the currently authenticated Alien Mini App user.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-white/10 p-4">
            <UserRound className="h-8 w-8 text-blue-300" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/45">
              <Wallet className="h-4 w-4 text-blue-300" />
              Balance
            </div>
            <div className="text-2xl font-black italic text-white">{balance.toFixed(1)} ALIEN</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/45">
              <History className="h-4 w-4 text-blue-300" />
              Status
            </div>
            <div className="text-sm font-bold text-white/80">{challengeHint}</div>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2">
          <PencilLine className="h-4 w-4 text-blue-300" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white/75">Username</h3>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={username}
            maxLength={24}
            onChange={(event) => setUsernameDraft(event.target.value)}
            className="flex-1 rounded-2xl border border-white/10 bg-[#090d18] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-blue-400"
            placeholder="Enter username"
          />
          <button
            onClick={() => saveUsernameMutation.mutate(username)}
            disabled={saveUsernameMutation.isPending}
            className="min-w-24 rounded-2xl bg-blue-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-60"
          >
            {saveUsernameMutation.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Save'}
          </button>
        </div>
        <p className="text-xs font-medium text-white/35">
          Maximum 24 characters. This username is saved for the currently signed-in Alien user.
        </p>
      </section>

      <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2">
          <IdCard className="h-4 w-4 text-blue-300" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white/75">Identity</h3>
        </div>

        {[
          { label: 'Internal User ID', value: profile.id },
          { label: 'Alien User ID', value: profile.alienId },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-[#090d18] p-4">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {item.label}
            </div>
            <div className="flex items-center justify-between gap-3">
              <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-white/80">
                {shortenIdentity(item.value)}
              </code>
              <button
                onClick={() => copyValue(item.label, item.value)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
              >
                {copiedField === item.label ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-blue-300" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white/75">Recent Wallet Activity</h3>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {transactions?.slice(0, 8).map((tx) => {
              const positive = tx.type === 'DEPOSIT' || tx.type === 'WIN';
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#090d18] p-4"
                >
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/45">{tx.type}</div>
                    <div className="mt-1 text-xs font-medium text-white/35">
                      {new Date(tx.createdAt).toLocaleString()} - {tx.status}
                    </div>
                  </div>
                  <div className={`text-lg font-black italic ${positive ? 'text-green-400' : 'text-white/75'}`}>
                    {positive ? '+' : '-'}{tx.amount}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!transactions?.length && (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm font-medium text-white/35">
              No transactions have been recorded for this user yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

