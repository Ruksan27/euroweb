import React, { useState } from 'react';
import axios from 'axios';
import { LucideX, LucideMail, LucideLock, LucideUser, LucideArrowRight } from 'lucide-react';
import { API } from '../config/api';
import { toast } from 'react-hot-toast';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || (!isLogin && !formData.fullName)) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const endpoint = isLogin ? `${API.base}/api/auth/login` : `${API.base}/api/auth/register`;
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(endpoint, payload);
      
      // Save details to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success(isLogin ? 'Logged in successfully! 🔓' : 'Account created successfully! 🎉');
      onAuthSuccess(response.data.user);
      onClose();
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden glass border-white/10 rounded-3xl p-8 shadow-2xl animate-scale-up">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <LucideX size={18} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {isLogin ? 'Sign in to access and secure your Europass CVs' : 'Register to build and save your CVs securely'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <LucideUser size={18} />
              </div>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all text-white outline-none placeholder-slate-500 text-sm"
                required={!isLogin}
              />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <LucideMail size={18} />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all text-white outline-none placeholder-slate-500 text-sm"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <LucideLock size={18} />
            </div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all text-white outline-none placeholder-slate-500 text-sm"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-xl font-semibold text-sm shadow-xl shadow-primary-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            {!loading && <LucideArrowRight size={16} />}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
