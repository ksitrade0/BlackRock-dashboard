'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Check, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Style Captcha States
  const [isHuman, setIsHuman] = useState(false);
  const [verifyingCaptcha, setVerifyingCaptcha] = useState(false);

  const handleCaptchaClick = () => {
    if (isHuman) return;
    setVerifyingCaptcha(true);
    setTimeout(() => {
      setVerifyingCaptcha(false);
      setIsHuman(true);
      setError('');
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isHuman) {
      setError('ভেরিফিকেশন সম্পূর্ণ করুন: আপনি রোবট নন তা নিশ্চিত করুন।');
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
        setError(data.error || 'ভুল জিমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে!');
        setIsHuman(false);
      }
    } catch {
      setError('নেটওয়ার্ক সংযোগ বিচ্ছিন্ন। দয়া করে আবার চেষ্টা করুন।');
      setIsHuman(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background SpaceX Style Glow Effect */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -top-32 -left-32"></div>
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -bottom-32 -right-32"></div>

      {/* Login Card */}
      <div className="relative bg-[#111622]/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-md">
        
        {/* Portal Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xl mb-3 shadow-lg shadow-blue-500/30">
            BR
          </div>
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">
            BLACK ROCK PORTAL
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1.5 tracking-wide">
            সিকিউরড এন্টারপ্রাইজ লজিস্টিকস ড্যাশবোর্ড
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 mb-6 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Gmail Field */}
          <div>
            <label className="text-xs font-black text-slate-300 block mb-2 tracking-wide uppercase">
              জিমেইল আইডি
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-11 pr-4 py-3 bg-[#1a2130] border border-slate-700/80 rounded-xl font-bold text-sm text-white placeholder:text-slate-500 focus:bg-[#20293d] focus:border-blue-500 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wide">
                পাসওয়ার্ড
              </label>
              <button
                type="button"
                onClick={() => alert('পাসওয়ার্ড রিসেট করতে অ্যাডমিনের সাথে যোগাযোগ করুন।')}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-11 py-3 bg-[#1a2130] border border-slate-700/80 rounded-xl font-bold text-sm text-white placeholder:text-slate-500 focus:bg-[#20293d] focus:border-blue-500 focus:outline-none transition-all shadow-inner tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Google Style Dark Captcha */}
          <div className="bg-[#1a2130] border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm mt-2">
            <div className="flex items-center gap-3 pl-1">
              <button
                type="button"
                onClick={handleCaptchaClick}
                className={`w-6 h-6 bg-[#111622] border-2 rounded flex items-center justify-center transition-all ${
                  isHuman ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-400'
                }`}
              >
                {verifyingCaptcha ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : isHuman ? (
                  <Check className="w-4 h-4 text-emerald-400 font-black" />
                ) : null}
              </button>
              <span className="text-xs font-bold text-slate-200 tracking-wide">
                I'm not a robot
              </span>
            </div>
            
            <div className="flex flex-col items-center pr-1">
              <img 
                src="https://www.gstatic.com/recaptcha/api2/logo_48.png" 
                alt="reCAPTCHA" 
                className="w-6 opacity-70 filter invert"
              />
              <span className="text-[8px] text-slate-500 mt-0.5 tracking-tighter">reCAPTCHA</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isHuman}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
          >
            {loading ? 'যাচাই করা হচ্ছে...' : 'প্যানেলে প্রবেশ করুন'}
          </button>
        </form>

        {/* Footer Note */}
        <div className="text-center mt-8 pt-4 border-t border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-500">
            Authorized Personnel Only • Black Rock Corporation
          </p>
        </div>

      </div>
    </div>
  );
}