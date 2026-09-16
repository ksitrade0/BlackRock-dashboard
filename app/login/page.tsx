'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ShieldCheck, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaChallenge, setCaptchaChallenge] = useState({ num1: 3, num2: 4, answer: 7 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaChallenge({ num1: n1, num2: n2, answer: n1 + n2 });
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parseInt(captchaInput.trim(), 10) !== captchaChallenge.answer) {
      setError('ভুল ক্যাপচা উত্তর! আবার চেষ্টা করুন।');
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/');
      } else {
        setError(data.error || 'ভুল ইউজারনেম বা পাসওয়ার্ড!');
        generateCaptcha();
      }
    } catch {
      setError('লগইন ব্যর্থ হয়েছে। নেটওয়ার্ক চেক করুন।');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-slate-700">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-950 uppercase tracking-widest">BLACK ROCK PORTAL</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">লগইন করে ড্যাশবোর্ডে প্রবেশ করুন</p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-100 text-rose-900 border-2 border-rose-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1">ইউজারনেম</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-sm focus:border-slate-950 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-800 block mb-1">পাসওয়ার্ড</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-sm focus:border-slate-950 focus:outline-none"
              />
            </div>
          </div>

          {/* ম্যাথ ক্যাপচা বক্স */}
          <div className="bg-slate-100 p-3 rounded-xl border-2 border-slate-300">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> সিকিউরিটি ক্যাপচা:
              </span>
              <button
                type="button"
                onClick={generateCaptcha}
                className="text-slate-500 hover:text-slate-900 transition"
                title="নতুন ক্যাপচা"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                {captchaChallenge.num1} + {captchaChallenge.num2} = ?
              </span>
              <input
                type="number"
                required
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="উত্তর"
                className="w-24 px-2.5 py-1.5 border-2 border-slate-300 rounded-lg text-center font-black text-sm focus:border-slate-950 focus:outline-none bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-950 hover:bg-slate-800 text-white py-3 rounded-xl font-black text-sm transition shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'যাচাই হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}