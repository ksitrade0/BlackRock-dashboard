'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, Check, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Style Captcha States (ম্যাথ ক্যাপচার বদলে)
  const [isHuman, setIsHuman] = useState(false);
  const [verifyingCaptcha, setVerifyingCaptcha] = useState(false);

  const handleCaptchaClick = () => {
    if (isHuman) return;
    setVerifyingCaptcha(true);
    setTimeout(() => {
      setVerifyingCaptcha(false);
      setIsHuman(true);
      setError('');
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // নতুন ক্যাপচা চেক
    if (!isHuman) {
      setError('অনুগ্রহ করে নিশ্চিত করুন যে আপনি রোবট নন!');
      return;
    }

    setLoading(true);

    try {
      // আপনার অরিজিনাল লগইন API কল
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
      } else {
        setError(data.error || 'ভুল ইউজারনেম বা পাসওয়ার্ড!');
        setIsHuman(false); // ভুল হলে ক্যাপচা আবার রিসেট হবে
      }
    } catch {
      setError('লগইন ব্যর্থ হয়েছে। নেটওয়ার্ক চেক করুন।');
      setIsHuman(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-950 uppercase tracking-widest">
            BLACK ROCK PORTAL
          </h2>
          <p className="text-sm font-bold text-slate-500 mt-1">
            লগইন করে ড্যাশবোর্ডে প্রবেশ করুন
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 mb-5 rounded-xl bg-rose-100 text-rose-900 border-2 border-rose-400 text-xs font-bold text-center animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Username Field */}
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1.5">
              ইউজারনেম
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ksitrade0@gmail.com"
                className="w-full pl-10 pr-3 py-2.5 bg-[#f0f4f8] border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1.5">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#f0f4f8] border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors tracking-wider"
              />
              {/* Eye Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Forgot Password Link */}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => alert('পাসওয়ার্ড রিসেট অপশনটি এখনো যুক্ত করা হয়নি।')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
          </div>

          {/* Google Style Captcha */}
          <div className="bg-[#f9f9f9] border border-[#d3d3d3] rounded-[3px] p-2 flex items-center justify-between shadow-sm mt-2">
            <div className="flex items-center gap-3 pl-2">
              <button
                type="button"
                onClick={handleCaptchaClick}
                className={`w-7 h-7 bg-white border-2 rounded-sm flex items-center justify-center transition-all ${
                  isHuman ? 'border-transparent' : 'border-[#c1c1c1] hover:border-[#a0a0a0]'
                }`}
              >
                {verifyingCaptcha ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : isHuman ? (
                  <Check className="w-6 h-6 text-emerald-600 font-black" />
                ) : null}
              </button>
              <span className="text-sm font-medium text-[#222]">
                I'm not a robot
              </span>
            </div>
            
            <div className="flex flex-col items-center pr-2 cursor-pointer">
              <img 
                src="https://www.gstatic.com/recaptcha/api2/logo_48.png" 
                alt="reCAPTCHA" 
                className="w-7 opacity-90"
              />
              <span className="text-[9px] text-[#555] mt-1 tracking-tight">reCAPTCHA</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isHuman}
            className="w-full bg-[#0a0a0a] hover:bg-black text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'যাচাই হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}