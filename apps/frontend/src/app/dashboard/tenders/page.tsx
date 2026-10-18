'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Gavel,
  Plus,
  Search,
  Target,
  Trophy,
  Timer,
  Landmark,
  LayoutGrid,
  List,
  Building2,
  User,
  RefreshCw,
  Inbox,
  Megaphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { PermissionGate } from '@/components/auth/RequirePermission';
import { DeadlineChip, ReadinessBar, TenderStatusBadge } from '@/components/tenders/TenderBadges';
import {
  CLOSED_STAGES,
  PIPELINE_STAGES,
  STAGE_STYLES,
  TENDER_CATEGORIES,
  TenderListItem,
  TenderSummary,
  formatCompactETB,
} from '@/components/tenders/tender-meta';
import { apiRequest } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

type View = 'board' | 'list';
const VIEW_KEY = 'lk_tenders_view';

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <Card className="border border-slate-100 shadow-xs">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
          <div className="text-xl font-black text-slate-900 mt-1 truncate">{value}</div>
          <span className="text-[10px] text-slate-500 font-medium">{sub}</span>
        </div>
        <div className={cn('p-3 rounded-lg shrink-0', tone)}>
          <Icon size={20} />
        </div>
      </CardContent>
    </Card>
  );
}

function TenderCard({ t }: { t: TenderListItem }) {
  const value = t.bidAmount ?? t.estimatedValue;
  return (
    <Link
      href={`/dashboard/tenders/${t.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-3 shadow-xs hover:border-sky-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-mono text-slate-400 truncate">{t.tenderNumber}</span>
        <DeadlineChip deadline={t.submissionDeadline} status={t.status} />
      </div>
      <h4 className="mt-1.5 text-xs font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#0284c7]">
        {t.title}
      </h4>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 truncate">
        <Building2 size={10} className="shrink-0" />
        {t.procuringEntity}
      </p>

      <div className="mt-2.5 flex items-end justify-between">
        <div>
          <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">
            {t.bidAmount != null ? 'Our bid' : 'Estimate'}
          </span>
          <span className="text-sm font-black text-slate-900">{formatCompactETB(value)}</span>
        </div>
        <div className="text-right">
          <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Win chance</span>
          <span
            className={cn('text-sm font-black', t.winProbability >= 60 ? 'text-emerald-600' : t.winProbability >= 35 ? 'text-amber-600' : 'text-slate-500')}
          >
            {t.winProbability}%
          </span>
        </div>
      </div>

      {(t.status === 'Identified' || t.status === 'Preparing') && (
        <ReadinessBar done={t.checklistDone} total={t.checklistTotal} className="mt-2.5" />
      )}

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1 truncate">
          <User size={10} />
          {t.bidManager ? `${t.bidManager.firstName} ${t.bidManager.lastName}` : 'Unassigned'}
        </span>
        {t.requiredGrade && <span className="font-bold text-slate-600 bg-slate-100 rounded px-1.5">{t.requiredGrade}</span>}
      </div>
    </Link>
  );
}

export default function TendersPage() {
  const [tenders, setTenders] = useState<TenderListItem[]>([]);
  const [summary, setSummary] = useState<TenderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<View>('board');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === 'board' || saved === 'list') setView(saved);
    } catch {
      // storage unavailable — keep default view
    }
  }, []);

  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // ignore
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, sum] = await Promise.all([
        apiRequest<TenderListItem[]>('/tenders'),
        apiRequest<TenderSummary>('/tenders/summary'),
      ]);
      setTenders(list);
      setSummary(sum);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenders.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.tenderNumber.toLowerCase().includes(q) ||
        t.procuringEntity.toLowerCase().includes(q) ||
        (t.regionOrCity ?? '').toLowerCase().includes(q);
      const matchesCategory = category === 'ALL' || t.category === category;
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tenders, search, category, statusFilter]);

  const recentOutcomes = useMemo(
    () =>
      filtered
        .filter((t) => (CLOSED_STAGES as readonly string[]).includes(t.status))
        .sort((a, b) => new Date(b.submissionDeadline).getTime() - new Date(a.submissionDeadline).getTime())
        .slice(0, 8),
    [filtered],
  );

  if (loading && !summary) return <LoadingState message="Loading tender pipeline..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Gavel size={22} className="text-[#0284c7]" />
            Tenders & Bids
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track every bid opportunity from discovery to award — deadlines, bid documents, securities, and win rate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/tenders/board"
            className="flex items-center gap-1.5 border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0284c7] px-3 py-1.5 rounded-md text-xs font-bold shadow-xs"
          >
            <Megaphone size={14} />
            Tender Board
          </Link>
          <button
            onClick={load}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <PermissionGate permission="tenders:create">
            <Link
              href="/dashboard/tenders/new"
              className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-xs transition-colors"
            >
              <Plus size={15} />
              New Tender
            </Link>
          </PermissionGate>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Weighted Pipeline"
            value={formatCompactETB(summary.weightedPipelineValue)}
            sub={`${summary.openCount} open bids · ${formatCompactETB(summary.openPipelineValue)} face value`}
            icon={Target}
            tone="bg-sky-50 text-[#0284c7]"
          />
          <KpiCard
            label="Win Rate"
            value={summary.winRate === null ? '—' : `${summary.winRate}%`}
            sub={`${summary.wonCount} won · ${summary.lostCount} lost · ${formatCompactETB(summary.wonValue)} awarded`}
            icon={Trophy}
            tone="bg-emerald-50 text-emerald-600"
          />
          <KpiCard
            label="Due in 7 Days"
            value={<span className={summary.dueThisWeek ? 'text-amber-600' : undefined}>{summary.dueThisWeek} bids</span>}
            sub={
              summary.overdue ? (
                <span className="text-rose-600 font-bold">{summary.overdue} past deadline, still not submitted</span>
              ) : (
                'Nothing overdue'
              )
            }
            icon={Timer}
            tone="bg-amber-50 text-amber-600"
          />
          <KpiCard
            label="Bid Security Tied Up"
            value={formatCompactETB(summary.bidSecurityOutstanding)}
            sub="CPOs & guarantees not yet returned"
            icon={Landmark}
            tone="bg-violet-50 text-violet-600"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tender title, reference, client, region..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 bg-white"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
        >
          <option value="ALL">All Categories</option>
          {TENDER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        {view === 'list' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
          >
            <option value="ALL">All Statuses</option>
            {[...PIPELINE_STAGES, ...CLOSED_STAGES].map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 self-start">
          {(['board', 'list'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => changeView(v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors',
                view === v ? 'bg-[#0f172a] text-white' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              {v === 'board' ? <LayoutGrid size={13} /> : <List size={13} />}
              {v === 'board' ? 'Pipeline' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {tenders.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Inbox size={36} className="text-slate-300 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No tenders yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Register the first bid opportunity from the e-GP portal, a newspaper notice, or a direct invitation.
          </p>
          <PermissionGate permission="tenders:create">
            <Link href="/dashboard/tenders/new" className="bg-[#0284c7] text-white px-4 py-2 rounded-md text-xs font-bold">
              Register a Tender
            </Link>
          </PermissionGate>
        </div>
      ) : view === 'board' ? (
        <>
          {/* Pipeline board */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {PIPELINE_STAGES.map((stage) => {
              const items = filtered.filter((t) => t.status === stage);
              const total = items.reduce((sum, t) => sum + (t.bidAmount ?? t.estimatedValue), 0);
              return (
                <div key={stage} className={cn('rounded-lg bg-slate-50/80 border border-slate-100 border-t-4', STAGE_STYLES[stage].column)}>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{stage}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-1.5">
                        {items.length}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{formatCompactETB(total)}</span>
                  </div>
                  <div className="px-2 pb-2 space-y-2 min-h-[80px]">
                    {items.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6">Nothing here</p>
                    ) : (
                      items.map((t) => <TenderCard key={t.id} t={t} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {recentOutcomes.length > 0 && (
            <Card className="border border-slate-100 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Closed Tenders</CardTitle>
                <CardDescription className="text-xs text-slate-500">Won, lost, declined, and cancelled bids.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {recentOutcomes.map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/tenders/${t.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-slate-50 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 block truncate">{t.title}</span>
                      <span className="text-[10px] text-slate-500">{t.procuringEntity}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {t.convertedProject && (
                        <span className="text-[10px] font-semibold text-emerald-700 hidden sm:inline">→ {t.convertedProject.projectName}</span>
                      )}
                      <span className="font-bold text-slate-700">{formatCompactETB(t.awardedAmount ?? t.bidAmount ?? t.estimatedValue)}</span>
                      <TenderStatusBadge status={t.status} />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left text-slate-600">
                <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Tender</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4 text-right">Estimate</th>
                    <th className="py-3 px-4 text-right">Our Bid</th>
                    <th className="py-3 px-4 text-center">Docs</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">No tenders match these filters.</td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 max-w-xs">
                          <Link href={`/dashboard/tenders/${t.id}`} className="font-bold text-slate-900 hover:text-[#0284c7] block truncate">
                            {t.title}
                          </Link>
                          <span className="text-[10px] font-mono text-slate-400">{t.tenderNumber}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{t.procuringEntity}</td>
                        <td className="py-3 px-4">{t.category}</td>
                        <td className="py-3 px-4"><DeadlineChip deadline={t.submissionDeadline} status={t.status} /></td>
                        <td className="py-3 px-4 text-right">{formatCurrency(t.estimatedValue)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {t.bidAmount != null ? formatCurrency(t.bidAmount) : '—'}
                        </td>
                        <td className="py-3 px-4 text-center tabular-nums">{t.checklistDone}/{t.checklistTotal}</td>
                        <td className="py-3 px-4 text-center"><TenderStatusBadge status={t.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
