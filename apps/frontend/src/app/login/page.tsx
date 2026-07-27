'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const demoUsers = [
    { label: 'CEO / Owner', email: 'ceo@abcconstruction.com' },
    { label: 'Project Manager', email: 'pm@abcconstruction.com' },
    { label: 'Fleet Manager', email: 'fleet@abcconstruction.com' },
    { label: 'Inventory Manager', email: 'inventory@abcconstruction.com' },
    { label: 'HR Manager', email: 'hr@abcconstruction.com' },
    { label: 'Finance Officer', email: 'finance@abcconstruction.com' },
    { label: 'Site Manager', email: 'site@abcconstruction.com' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0c1a2e] to-[#0f172a] flex items-center justify-center p-4">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0284c7] shadow-lg shadow-[#0284c7]/30 mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Le'Kiray ERP</h1>
          <p className="text-sky-400 text-xs font-semibold tracking-widest uppercase mt-0.5">
            Contractor Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Sign in to your workspace</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              ABC Construction PLC — Ethiopia
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 mb-5">
              <AlertCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@abcconstruction.com"
                className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-[#0284c7]/20 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Demo Users Quick-fill */}
        <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            Demo Accounts — Password: <span className="font-mono text-slate-400">Password123!</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {demoUsers.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => {
                  setEmail(u.email);
                  setPassword('Password123!');
                }}
                className="text-left px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          Le'Kiray ERP — v1.0.0-MVP · Ethiopian Construction ERP
        </p>
      </div>
    </div>
  );
}
