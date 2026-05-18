import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { LucideFileText, LucideZap, LucideDownload, LucideLayout, LucideLayoutDashboard, LucideShield } from 'lucide-react'
import CVBuilder from './components/CVBuilder'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import { AdminLogin } from './components/AdminDashboard'

function App() {
  const [view, setView] = useState('landing')
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('admin_token') || null)
  const [editingCV, setEditingCV] = useState(null)

  // Admin route check
  if (window.location.hash === '#admin' || view === 'admin-login' || view === 'admin') {
    if (adminToken) {
      return (
        <>
          <Toaster position="top-right" />
          <AdminDashboard 
            onLogout={() => { setAdminToken(null); setView('landing'); }} 
            onEditCV={(cv) => { setEditingCV(cv); setView('builder'); }}
          />
        </>
      )
    }
    return (
      <>
        <Toaster position="top-right" />
        <AdminLogin onLogin={(token) => { setAdminToken(token); setView('admin'); }} />
      </>
    )
  }

  if (view === 'builder' || view === 'dashboard') {
    return (
      <div className="min-h-screen w-full text-white">
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        <nav className="w-full max-w-[1600px] mx-auto flex justify-between items-center px-4 sm:px-8 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <div className="bg-primary-600 p-2 rounded-lg">
              <LucideFileText size={18} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold">EuroBuilder AI</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-6">
            <button 
              onClick={() => setView('dashboard')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === 'dashboard' ? 'bg-primary-600/20 text-primary-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <LucideLayoutDashboard size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button 
              onClick={() => { setEditingCV(null); setView('builder') }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === 'builder' ? 'bg-primary-600/20 text-primary-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <LucideLayout size={16} />
              <span className="hidden sm:inline">Builder</span>
            </button>
            <button onClick={() => setView('landing')} className="text-slate-500 hover:text-white text-sm px-2 py-1.5 rounded-lg hover:bg-white/5 transition">Exit</button>
          </div>
        </nav>
        {view === 'builder' ? <CVBuilder initialData={editingCV} /> : <Dashboard />}
      </div>
    )
  }
  return (
    <div className="min-h-screen w-full text-white flex flex-col">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      
      {/* NAV */}
      <nav className="w-full max-w-[1600px] mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="bg-primary-600 p-2 rounded-lg shadow-lg shadow-primary-500/50">
            <LucideFileText size={20} />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight">EuroBuilder AI</h1>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <a href="#" className="hidden md:block text-slate-400 hover:text-white transition-colors text-sm">How it works</a>
          <a href="#" className="hidden md:block text-slate-400 hover:text-white transition-colors text-sm">Pricing (Free)</a>
          <button
            onClick={() => setView('admin-login')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-400 transition-colors text-sm px-2 py-1.5 rounded-lg hover:bg-white/5"
          >
            <LucideShield size={15} />
            <span className="hidden sm:inline">Admin</span>
          </button>
          <button
            onClick={() => { setEditingCV(null); setView('builder') }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-5 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO — fills remaining height */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs sm:text-sm font-medium">
            <LucideZap size={13} />
            <span>AI-Powered CV Automation</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight">
            Build your <span className="text-primary-500">Europass CV</span> in seconds.
          </h2>
          
          <p className="text-slate-400 text-base sm:text-lg max-w-xl">
            Upload your documents, let our AI extract the data, and generate a professional Europass CV automatically.
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
            <button 
              onClick={() => { setEditingCV(null); setView('builder') }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-xl shadow-primary-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Start Building Now
            </button>
            <button className="glass hover:bg-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all">
              Watch Demo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-10 border-t border-white/5">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold">100%</div>
              <div className="text-slate-500 text-xs sm:text-sm">Free to use</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold">AI</div>
              <div className="text-slate-500 text-xs sm:text-sm">Auto-extraction</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold">PDF</div>
              <div className="text-slate-500 text-xs sm:text-sm">ATS Friendly</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-primary-500/20 blur-3xl rounded-full"></div>
          <div className="relative glass rounded-3xl p-8 border-white/10 overflow-hidden aspect-[3/4] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-slate-500">CV Preview</div>
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/5 animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-1/2 bg-white/10 rounded-lg"></div>
                  <div className="h-4 w-3/4 bg-white/5 rounded-lg"></div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="h-4 w-full bg-white/5 rounded-lg"></div>
                <div className="h-4 w-full bg-white/5 rounded-lg"></div>
                <div className="h-4 w-2/3 bg-white/5 rounded-lg"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="h-32 bg-white/5 rounded-2xl"></div>
                <div className="h-32 bg-white/5 rounded-2xl"></div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <div className="flex-1 h-12 bg-primary-600/20 rounded-xl border border-primary-500/30"></div>
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                <LucideDownload size={20} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
