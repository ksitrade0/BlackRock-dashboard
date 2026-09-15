'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setMessage({ text: data.error || 'লগইন ব্যর্থ হয়েছে', type: 'error' });
      }
    } catch {
      setMessage({ text: 'সার্ভার সংযোগ সমস্যা! ইন্টারনেট চেক করুন।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message, type: 'success' });
      } else {
        setMessage({ text: data.error || 'অনুরোধ ব্যর্থ হয়েছে', type: 'error' });
      }
    } catch {
      setMessage({ text: 'সার্ভার সমস্যা হয়েছে', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-2 border-slate-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-slate-800">
            <ShieldCheck className="w-9 h-9 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-slate-950 uppercase">
            BLACK ROCK
          </h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            Enterprise Security Portal
          </p>
        </div>

        {message && (
          <div
            className={`p-3.5 mb-6 rounded-xl flex items-center gap-2 text-xs font-bold ${
              message.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400'
                : 'bg-rose-100 text-rose-900 border-2 border-rose-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-700" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {!isForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-800 block mb-1.5 uppercase">
                ভেরিফাইড জিমেইল
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-950 focus:outline-none focus:border-slate-950 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-black text-slate-800 uppercase">
                  পাসওয়ার্ড
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setMessage(null);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-950 focus:outline-none focus:border-slate-950 bg-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-slate-950 hover:bg-slate-900 active:bg-black text-white py-3 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordRecovery} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] font-bold text-amber-900 mb-2">
              পাসওয়ার্ড ভুলে গেলে আপনার অনুমোদিত জিমেইলে রিকভারি লিঙ্ক পাঠানো হবে।
            </div>

            <div>
              <label className="text-xs font-black text-slate-800 block mb-1.5 uppercase">
                আপনার অনুমোদিত জিমেইল লিখুন
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-950 focus:outline-none focus:border-slate-950 bg-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" /> {loading ? 'পাঠানো হচ্ছে...' : 'পাসওয়ার্ড রিকভার করুন'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setMessage(null);
                }}
                className="text-xs font-black text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ← লগইন স্ক্রিনে ফিরে যান
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}