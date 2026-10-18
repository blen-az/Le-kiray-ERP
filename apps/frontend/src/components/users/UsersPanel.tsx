'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UserPlus,
  Search,
  Edit3,
  KeyRound,
  UserX,
  UserCheck,
  Loader2,
  Copy,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface WorkspaceUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  isLocked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: { id: string; name: string }[];
}

export interface WorkspaceRole {
  id: string;
  name: string;
  description: string | null;
  locked: boolean;
  userCount: number;
  permissions: string[];
}

const inputCls =
  'w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 bg-white';

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className={cn('w-full rounded-lg bg-white shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto', wide ? 'max-w-lg' : 'max-w-md')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // clipboard blocked — user can still select the text
        }
      }}
      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

/** Shown once after creating a user or resetting a password */
export function CredentialsCard({
  name,
  email,
  password,
  onDone,
  companyName,
}: {
  name: string;
  email: string;
  password: string;
  onDone: () => void;
  companyName?: string;
}) {
  const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
  const instructions = `Hi ${name},\n\nYour Le'Kiray ERP account${companyName ? ` for ${companyName}` : ''} is ready.\n\nSign in at: ${loginUrl}\nEmail: ${email}\nTemporary password: ${password}\n\nYou will be asked to choose your own password when you first sign in.`;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs">
        <ShieldAlert size={16} className="shrink-0 mt-0.5" />
        <span>
          This temporary password is shown <b>only once</b>. Give it to {name} privately. They must replace it the first time they sign in.
        </span>
      </div>
      <div className="rounded-md border border-slate-200 divide-y divide-slate-100 text-xs">
        <div className="flex justify-between px-3 py-2">
          <span className="text-slate-500">Sign-in page</span>
          <span className="font-semibold text-slate-800 truncate ml-3">{loginUrl}</span>
        </div>
        <div className="flex justify-between px-3 py-2">
          <span className="text-slate-500">Email</span>
          <span className="font-semibold text-slate-800">{email}</span>
        </div>
        <div className="flex justify-between items-center px-3 py-2">
          <span className="text-slate-500">Temporary password</span>
          <span className="font-mono text-base font-black tracking-wider text-slate-900 select-all">{password}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CopyButton text={password} label="Copy password" />
        <CopyButton text={instructions} label="Copy full message" />
      </div>
      <button onClick={onDone} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-md text-xs font-bold">
        Done
      </button>
    </div>
  );
}

function RolePicker({
  roles,
  selected,
  onChange,
  canAssign,
}: {
  roles: WorkspaceRole[];
  selected: string[];
  onChange: (ids: string[]) => void;
  canAssign: (role: WorkspaceRole) => boolean;
}) {
  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {roles.map((r) => {
        const allowed = canAssign(r);
        const checked = selected.includes(r.id);
        return (
          <label
            key={r.id}
            className={cn(
              'flex items-start gap-2.5 p-2.5 rounded-md border text-xs',
              checked ? 'border-sky-300 bg-sky-50' : 'border-slate-200',
              allowed ? 'cursor-pointer hover:border-sky-300' : 'opacity-50 cursor-not-allowed',
            )}
            title={allowed ? undefined : 'This role grants permissions you do not have'}
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-[#0284c7]"
              disabled={!allowed}
              checked={checked}
              onChange={(e) => onChange(e.target.checked ? [...selected, r.id] : selected.filter((id) => id !== r.id))}
            />
            <span>
              <span className="font-bold text-slate-900 block">{r.name}</span>
              <span className="text-[10px] text-slate-500">
                {r.description ?? ''} {r.description ? '·' : ''} {r.permissions.length} permissions
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function fmtDate(v: string | null) {
  if (!v) return 'Never';
  return new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function UsersPanel() {
  const { user: me, hasPermission, isCEO } = useAuth();
  const canManage = hasPermission('users:manage');

  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState<null | { type: 'create' } | { type: 'edit'; user: WorkspaceUser } | { type: 'credentials'; name: string; email: string; password: string }>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state (shared by create/edit)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [u, r] = await Promise.all([apiRequest<WorkspaceUser[]>('/users'), apiRequest<WorkspaceRole[]>('/roles')]);
      setUsers(u);
      setRoles(r);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Mirrors the backend no-escalation rule so the UI only offers assignable roles */
  const canAssign = useCallback(
    (role: WorkspaceRole) => {
      if (role.name === 'CEO / Owner') return isCEO();
      return role.permissions.every((p) => hasPermission(p));
    },
    [hasPermission, isCEO],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roles.some((r) => r.name.toLowerCase().includes(q)),
    );
  }, [users, search]);

  const openCreate = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRoleIds([]);
    setFormError(null);
    setModal({ type: 'create' });
  };

  const openEdit = (u: WorkspaceUser) => {
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setEmail(u.email);
    setRoleIds(u.roles.map((r) => r.id));
    setFormError(null);
    setModal({ type: 'edit', user: u });
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('form');
    setFormError(null);
    try {
      const res = await apiRequest<{ user: WorkspaceUser; temporaryPassword: string }>('/users', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, roleIds }),
      });
      await load();
      setModal({ type: 'credentials', name: res.user.firstName, email: res.user.email, password: res.temporaryPassword });
    } catch (err: any) {
      setFormError(err.message || 'Could not add user');
    } finally {
      setBusy(null);
    }
  };

  const submitEdit = async (e: React.FormEvent, target: WorkspaceUser) => {
    e.preventDefault();
    setBusy('form');
    setFormError(null);
    try {
      await apiRequest(`/users/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, roleIds }),
      });
      await load();
      setModal(null);
    } catch (err: any) {
      setFormError(err.message || 'Could not save changes');
    } finally {
      setBusy(null);
    }
  };

  const resetPassword = async (u: WorkspaceUser) => {
    if (!window.confirm(`Reset ${u.firstName} ${u.lastName}'s password? They will be signed out and must use the new temporary password.`)) return;
    setBusy(`reset:${u.id}`);
    try {
      const res = await apiRequest<{ temporaryPassword: string }>(`/users/${u.id}/reset-password`, { method: 'POST' });
      await load();
      setModal({ type: 'credentials', name: u.firstName, email: u.email, password: res.temporaryPassword });
    } catch (err: any) {
      window.alert(err.message || 'Could not reset password');
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async (u: WorkspaceUser) => {
    const verb = u.isActive ? 'Deactivate' : 'Reactivate';
    if (!window.confirm(`${verb} ${u.firstName} ${u.lastName}?${u.isActive ? ' They will no longer be able to sign in.' : ''}`)) return;
    setBusy(`active:${u.id}`);
    try {
      await apiRequest(`/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !u.isActive }) });
      await load();
    } catch (err: any) {
      window.alert(err.message || `Could not ${verb.toLowerCase()} user`);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingState message="Loading users..." />;

  return (
    <div className="space-y-4">
      {error && <div className="p-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or role..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 bg-white"
          />
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-bold shadow-xs"
          >
            <UserPlus size={15} /> Add User
          </button>
        )}
      </div>

      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Roles</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last sign-in</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No users match your search.</td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id} className={cn('hover:bg-slate-50/50', !u.isActive && 'opacity-60')}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px] shrink-0">
                            {u.firstName[0]}
                            {u.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block">
                              {u.firstName} {u.lastName}
                              {isMe && <span className="ml-1.5 text-[10px] font-semibold text-sky-600">(you)</span>}
                            </span>
                            <span className="text-[11px] text-slate-500">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span key={r.id} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {!u.isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Deactivated</span>
                        ) : u.isLocked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Locked (failed logins)</span>
                        ) : u.mustChangePassword ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Awaiting first sign-in</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Active</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{fmtDate(u.lastLoginAt)}</td>
                      {canManage && (
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(u)} title="Edit name & roles" className="p-1.5 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                              <Edit3 size={14} />
                            </button>
                            {!isMe && (
                              <>
                                <button
                                  onClick={() => resetPassword(u)}
                                  disabled={!!busy}
                                  title={u.isLocked ? 'Reset password & unlock' : 'Reset password'}
                                  className="p-1.5 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                >
                                  {busy === `reset:${u.id}` ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                                </button>
                                <button
                                  onClick={() => toggleActive(u)}
                                  disabled={!!busy}
                                  title={u.isActive ? 'Deactivate' : 'Reactivate'}
                                  className={cn(
                                    'p-1.5 rounded disabled:opacity-50',
                                    u.isActive ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50',
                                  )}
                                >
                                  {busy === `active:${u.id}` ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : u.isActive ? (
                                    <UserX size={14} />
                                  ) : (
                                    <UserCheck size={14} />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {modal?.type === 'create' && (
        <Modal title="Add User" onClose={() => setModal(null)} wide>
          <form onSubmit={submitCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">First name</label>
                <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Last name</label>
                <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Work email (used to sign in)</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Roles</label>
              <RolePicker roles={roles} selected={roleIds} onChange={setRoleIds} canAssign={canAssign} />
            </div>
            <p className="text-[11px] text-slate-500">A temporary password is generated for you to hand over. They choose their own at first sign-in.</p>
            {formError && <p className="text-[11px] text-rose-600 font-medium">{formError}</p>}
            <button
              type="submit"
              disabled={busy === 'form' || roleIds.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] disabled:opacity-50 text-white py-2 rounded-md text-xs font-bold"
            >
              {busy === 'form' && <Loader2 size={13} className="animate-spin" />}
              Create account
            </button>
          </form>
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title={`Edit ${modal.user.firstName} ${modal.user.lastName}`} onClose={() => setModal(null)} wide>
          <form onSubmit={(e) => submitEdit(e, modal.user)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">First name</label>
                <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Last name</label>
                <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
              <input value={email} disabled className={`${inputCls} bg-slate-50 text-slate-500`} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Roles</label>
              <RolePicker roles={roles} selected={roleIds} onChange={setRoleIds} canAssign={canAssign} />
            </div>
            <p className="text-[11px] text-slate-500">Role changes take effect within 15 minutes, or immediately after they sign in again.</p>
            {formError && <p className="text-[11px] text-rose-600 font-medium">{formError}</p>}
            <button
              type="submit"
              disabled={busy === 'form' || roleIds.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] disabled:opacity-50 text-white py-2 rounded-md text-xs font-bold"
            >
              {busy === 'form' && <Loader2 size={13} className="animate-spin" />}
              Save changes
            </button>
          </form>
        </Modal>
      )}

      {modal?.type === 'credentials' && (
        <Modal title="Account credentials" onClose={() => setModal(null)}>
          <CredentialsCard name={modal.name} email={modal.email} password={modal.password} onDone={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
