import React, { useState } from 'react';
import { LucideMail, LucideLock, LucideUser, LucideLoader2, LucideLogIn, LucideUserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { API } from '../config/api';

export default function Auth({ onAuthSuccess, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !fullName)) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? `${API.user}/login` : `${API.user}/register`;
    const payload = isLogin ? { email, password } : { email, password, fullName };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(isLogin ? 'Successfully logged in!' : 'Successfully registered!');
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        onAuthSuccess(data.token, data.user);
      } else {
        toast.error(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Connection failed. Please check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

        {/* Tab Toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-8 border border-white/5 relative z-10">
          <button
            onClick={() => { setIsLogin(true); toast.dismiss(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${isLogin ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); toast.dismiss(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${!isLogin ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Create Account
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
            {isLogin ? 'Sign in to access your saved Europass CVs' : 'Create an account to save and manage your CVs'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {!isLogin && (
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-sm"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <LucideMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-sm"
                placeholder="example@mail.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <LucideLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <LucideLoader2 size={18} className="animate-spin" />
            ) : isLogin ? (
              <LucideLogIn size={18} />
            ) : (
              <LucideUserPlus size={18} />
            )}
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6 relative z-10">
          <button
            onClick={onBack}
            className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 transition"
          >
            Cancel and Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
