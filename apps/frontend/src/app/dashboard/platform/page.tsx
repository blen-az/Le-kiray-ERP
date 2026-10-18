'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Globe2,
  Building2,
  Plus,
  Search,
  Users,
  PauseCircle,
  PlayCircle,
  KeyRound,
  Edit3,
  Loader2,
  Activity,
  Megaphone,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { CredentialsCard, Modal } from '@/components/users/UsersPanel';
import TenderNoticesPanel from '@/components/platform/TenderNoticesPanel';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

interface Company {
  id: string;
  name: string;
  status: string;
  suspendedAt: string | null;
  tinNumber: string | null;
  licenseGrade: string | null;
  city: string | null;
  phone: string | null;
  createdAt: string;
  userCount: number;
  activeUserCount: number;
  projectCount: number;
  lastActiveAt: string | null;
  owners: Owner[];
}

interface Stats {
  companies: number;
  active: number;
  suspended: number;
  users: number;
  activeLast30Days: number;
}

type Credentials = { name: string; email: string; password: string; companyName: string };

const inputCls =
  'w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 bg-white';

function relative(v: string | null) {
  if (!v) return 'Never';
  const days = Math.floor((Date.now() - new Date(v).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const EMPTY_FORM = {
  companyName: '',
  tinNumber: '',
  licenseGrade: '',
  city: '',
  phone: '',
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
};

function CompaniesView() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Suspended'>('ALL');

  const [modal, setModal] = useState<null | { type: 'onboard' } | { type: 'edit'; company: Company } | { type: 'credentials'; creds: Credentials }>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, s] = await Promise.all([apiRequest<Company[]>('/platform/companies'), apiRequest<Stats>('/platform/stats')]);
      setCompanies(c);
      setStats(s);
    } catch (err: any) {
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      const matches =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.tinNumber ?? '').toLowerCase().includes(q) ||
        (c.city ?? '').toLowerCase().includes(q) ||
        c.owners.some((o) => o.email.toLowerCase().includes(q) || `${o.firstName} ${o.lastName}`.toLowerCase().includes(q));
      return matches && (statusFilter === 'ALL' || c.status === statusFilter);
    });
  }, [companies, search, statusFilter]);

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submitOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('form');
    setFormError(null);
    try {
      const res = await apiRequest<{ company: { name: string }; owner: { firstName: string; email: string }; temporaryPassword: string }>(
        '/platform/companies',
        { method: 'POST', body: JSON.stringify(form) },
      );
      await load();
      setModal({
        type: 'credentials',
        creds: { name: res.owner.firstName, email: res.owner.email, password: res.temporaryPassword, companyName: res.company.name },
      });
    } catch (err: any) {
      setFormError(err.message || 'Could not onboard company');
    } finally {
      setBusy(null);
    }
  };

  const submitEdit = async (e: React.FormEvent, company: Company) => {
    e.preventDefault();
    setBusy('form');
    setFormError(null);
    try {
      await apiRequest(`/platform/companies/${company.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.companyName,
          tinNumber: form.tinNumber,
          licenseGrade: form.licenseGrade,
          city: form.city,
          phone: form.phone,
        }),
      });
      await load();
      setModal(null);
    } catch (err: any) {
      setFormError(err.message || 'Could not save company');
    } finally {
      setBusy(null);
    }
  };

  const toggleStatus = async (c: Company) => {
    const suspending = c.status === 'Active';
    const msg = suspending
      ? `Suspend ${c.name}? All ${c.userCount} of its users will be signed out and unable to sign in. Their data is kept.`
      : `Reactivate ${c.name}? Its users will be able to sign in again.`;
    if (!window.confirm(msg)) return;
    setBusy(`status:${c.id}`);
    try {
      await apiRequest(`/platform/companies/${c.id}`, { method: 'PATCH', body: JSON.stringify({ status: suspending ? 'Suspended' : 'Active' }) });
      await load();
    } catch (err: any) {
      window.alert(err.message || 'Could not change status');
    } finally {
      setBusy(null);
    }
  };

  const resetOwner = async (c: Company) => {
    const owner = c.owners[0];
    if (!owner || !window.confirm(`Issue a new temporary password to ${owner.firstName} ${owner.lastName} (${owner.email})?`)) return;
    setBusy(`reset:${c.id}`);
    try {
      const res = await apiRequest<{ owner: Owner; temporaryPassword: string }>(`/platform/companies/${c.id}/reset-owner-password`, {
        method: 'POST',
        body: JSON.stringify({ userId: owner.id }),
      });
      await load();
      setModal({
        type: 'credentials',
        creds: { name: res.owner.firstName, email: res.owner.email, password: res.temporaryPassword, companyName: c.name },
      });
    } catch (err: any) {
      window.alert(err.message || 'Could not reset password');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingState message="Loading platform..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-slate-500">Each company manages its own users and roles once onboarded.</p>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setFormError(null);
            setModal({ type: 'onboard' });
          }}
          className="flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-bold shadow-xs"
        >
          <Plus size={15} /> Onboard Company
        </button>
      </div>

      {error && <div className="p-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Companies', value: stats.companies, sub: `${stats.active} active · ${stats.suspended} suspended`, icon: Building2, tone: 'bg-sky-50 text-[#0284c7]' },
            { label: 'Active Last 30 Days', value: stats.activeLast30Days, sub: 'Companies with a sign-in', icon: Activity, tone: 'bg-emerald-50 text-emerald-600' },
            { label: 'Users', value: stats.users, sub: 'Active accounts, all companies', icon: Users, tone: 'bg-violet-50 text-violet-600' },
            { label: 'Suspended', value: stats.suspended, sub: 'Cannot sign in', icon: PauseCircle, tone: 'bg-amber-50 text-amber-600' },
          ].map((k) => (
            <Card key={k.label} className="border border-slate-100 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{k.value}</div>
                  <span className="text-[10px] text-slate-500 font-medium">{k.sub}</span>
                </div>
                <div className={cn('p-3 rounded-lg', k.tone)}>
                  <k.icon size={20} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, TIN, city, or owner..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-700"
        >
          <option value="ALL">All statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-center">Users</th>
                <th className="py-3 px-4 text-center">Projects</th>
                <th className="py-3 px-4">Last active</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    {companies.length <= 1 ? 'No customer companies yet — click "Onboard Company" to add the first one.' : 'No companies match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const owner = c.owners[0];
                  const isOwn = c.id === user?.companyId;
                  return (
                    <tr key={c.id} className={cn('hover:bg-slate-50/50', c.status === 'Suspended' && 'bg-amber-50/30')}>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {c.name}
                          {isOwn && <span className="ml-1.5 text-[10px] font-semibold text-sky-600">(your workspace)</span>}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {[c.licenseGrade, c.city, c.tinNumber ? `TIN ${c.tinNumber}` : null].filter(Boolean).join(' · ') || 'No details'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {owner ? (
                          <>
                            <span className="font-semibold text-slate-800 block">
                              {owner.firstName} {owner.lastName}
                            </span>
                            <span className="text-[10px] text-slate-500">{owner.email}</span>
                            {owner.mustChangePassword && (
                              <span className="block text-[10px] font-bold text-amber-600">Hasn&apos;t signed in yet</span>
                            )}
                          </>
                        ) : (
                          <span className="text-rose-600 font-semibold">No owner</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums">{c.activeUserCount}</td>
                      <td className="py-3 px-4 text-center tabular-nums">{c.projectCount}</td>
                      <td className="py-3 px-4 text-slate-500">{relative(c.lastActiveAt)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            c.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800',
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <button
                            title="Edit details"
                            onClick={() => {
                              setForm({
                                ...EMPTY_FORM,
                                companyName: c.name,
                                tinNumber: c.tinNumber ?? '',
                                licenseGrade: c.licenseGrade ?? '',
                                city: c.city ?? '',
                                phone: c.phone ?? '',
                              });
                              setFormError(null);
                              setModal({ type: 'edit', company: c });
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Edit3 size={14} />
                          </button>
                          {!isOwn && owner && (
                            <button
                              title="Reset owner password"
                              disabled={!!busy}
                              onClick={() => resetOwner(c)}
                              className="p-1.5 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                            >
                              {busy === `reset:${c.id}` ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                            </button>
                          )}
                          {!isOwn && (
                            <button
                              title={c.status === 'Active' ? 'Suspend company' : 'Reactivate company'}
                              disabled={!!busy}
                              onClick={() => toggleStatus(c)}
                              className={cn(
                                'p-1.5 rounded disabled:opacity-50',
                                c.status === 'Active' ? 'text-slate-400 hover:text-amber-700 hover:bg-amber-50' : 'text-amber-600 hover:text-emerald-700 hover:bg-emerald-50',
                              )}
                            >
                              {busy === `status:${c.id}` ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : c.status === 'Active' ? (
                                <PauseCircle size={14} />
                              ) : (
                                <PlayCircle size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {modal?.type === 'onboard' && (
        <Modal title="Onboard a Contractor Company" onClose={() => setModal(null)} wide>
          <form onSubmit={submitOnboard} className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Company</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company name *" className="col-span-2">
                  <input required value={form.companyName} onChange={set('companyName')} placeholder="Sur Construction PLC" className={inputCls} />
                </Field>
                <Field label="TIN">
                  <input value={form.tinNumber} onChange={set('tinNumber')} placeholder="0012345678" className={inputCls} />
                </Field>
                <Field label="Contractor grade">
                  <input value={form.licenseGrade} onChange={set('licenseGrade')} placeholder="GC-1" className={inputCls} />
                </Field>
                <Field label="City">
                  <input value={form.city} onChange={set('city')} placeholder="Addis Ababa" className={inputCls} />
                </Field>
                <Field label="Phone">
                  <input value={form.phone} onChange={set('phone')} placeholder="+251 911 234 567" className={inputCls} />
                </Field>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Owner account (CEO / Owner role)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name *">
                  <input required value={form.ownerFirstName} onChange={set('ownerFirstName')} className={inputCls} />
                </Field>
                <Field label="Last name *">
                  <input required value={form.ownerLastName} onChange={set('ownerLastName')} className={inputCls} />
                </Field>
                <Field label="Email (used to sign in) *" className="col-span-2">
                  <input required type="email" value={form.ownerEmail} onChange={set('ownerEmail')} placeholder="owner@company.et" className={inputCls} />
                </Field>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              This creates the company workspace with all standard roles (Project Manager, Site Manager, Fleet, Inventory, HR, Finance, Viewer) and an owner account
              with a one-time temporary password. The owner then adds their own team from <b>Users &amp; Access</b>.
            </p>
            {formError && <p className="text-[11px] text-rose-600 font-medium">{formError}</p>}
            <button
              type="submit"
              disabled={busy === 'form'}
              className="w-full flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] disabled:opacity-50 text-white py-2 rounded-md text-xs font-bold"
            >
              {busy === 'form' && <Loader2 size={13} className="animate-spin" />}
              Create company &amp; owner account
            </button>
          </form>
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title={`Edit ${modal.company.name}`} onClose={() => setModal(null)} wide>
          <form onSubmit={(e) => submitEdit(e, modal.company)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company name" className="col-span-2">
                <input required value={form.companyName} onChange={set('companyName')} className={inputCls} />
              </Field>
              <Field label="TIN">
                <input value={form.tinNumber} onChange={set('tinNumber')} className={inputCls} />
              </Field>
              <Field label="Contractor grade">
                <input value={form.licenseGrade} onChange={set('licenseGrade')} className={inputCls} />
              </Field>
              <Field label="City">
                <input value={form.city} onChange={set('city')} className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={set('phone')} className={inputCls} />
              </Field>
            </div>
            {formError && <p className="text-[11px] text-rose-600 font-medium">{formError}</p>}
            <button
              type="submit"
              disabled={busy === 'form'}
              className="w-full flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] disabled:opacity-50 text-white py-2 rounded-md text-xs font-bold"
            >
              {busy === 'form' && <Loader2 size={13} className="animate-spin" />}
              Save
            </button>
          </form>
        </Modal>
      )}

      {modal?.type === 'credentials' && (
        <Modal title={`${modal.creds.companyName} — owner credentials`} onClose={() => setModal(null)}>
          <CredentialsCard
            name={modal.creds.name}
            email={modal.creds.email}
            password={modal.creds.password}
            companyName={modal.creds.companyName}
            onDone={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

type Tab = 'companies' | 'board';

export default function PlatformAdminPage() {
  const [tab, setTab] = useState<Tab>('companies');

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Globe2 size={22} className="text-[#0284c7]" />
          Platform Admin
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Le&apos;Kiray operator tools: onboard contractor companies and publish tenders to every company.
        </p>
      </div>

      <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
        {([
          { id: 'companies', label: 'Companies', icon: Building2 },
          { id: 'board', label: 'Tender Board', icon: Megaphone },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-colors',
              tab === t.id ? 'bg-[#0f172a] text-white' : 'text-slate-500 hover:text-slate-900',
            )}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'companies' ? <CompaniesView /> : <TenderNoticesPanel />}
    </div>
  );
}
