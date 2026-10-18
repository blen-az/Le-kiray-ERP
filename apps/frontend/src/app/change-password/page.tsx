'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, AlertCircle, CheckCircle2, Circle, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

const RULES = [
  { label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { label: 'Contains a letter', test: (p: string) => /[A-Za-z]/.test(p) },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
];

export default function ChangePasswordPage() {
  const { user, isLoading, isAuthenticated, applySession, logout } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  const forced = user?.mustChangePassword === true;
  const rulesMet = RULES.every((r) => r.test(newPassword));
  const matches = newPassword.length > 0 && newPassword === confirm;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!rulesMet) return setError('The new password does not meet the requirements.');
    if (!matches) return setError('The two new passwords do not match.');

    setSaving(true);
    try {
      const data = await apiRequest<{ accessToken: string; user: any }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      applySession(data.accessToken, data.user);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Could not change password.');
      setSaving(false);
    }
  };

  if (isLoading || !user) return null;

  const inputCls =
    'w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0c1a2e] to-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0284c7] shadow-lg shadow-[#0284c7]/30 mb-3">
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {forced ? 'Set your own password' : 'Change password'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 text-center max-w-xs">
            {forced
              ? `Welcome, ${user.firstName}. You signed in with a temporary password — choose a private one to continue.`
              : 'Choose a new password for your account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {forced ? 'Temporary password' : 'Current password'}
            </label>
            <input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">New password</label>
            <input type="password" required autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
            <ul className="mt-2 space-y-1">
              {RULES.map((r) => {
                const ok = r.test(newPassword);
                return (
                  <li key={r.label} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {ok ? <CheckCircle2 size={12} /> : <Circle size={12} />} {r.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm new password</label>
            <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
            {confirm.length > 0 && !matches && <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>}
          </div>

          <button
            type="submit"
            disabled={saving || !rulesMet || !matches}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Save password
          </button>

          <div className="flex justify-between pt-1">
            {!forced ? (
              <button type="button" onClick={() => router.back()} className="text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-300"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
