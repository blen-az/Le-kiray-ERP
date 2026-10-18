'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Building2,
  MapPin,
  Banknote,
  CalendarClock,
  ListChecks,
  History,
  Trophy,
  XCircle,
  FolderPlus,
  ChevronRight,
  CheckCircle2,
  Circle,
  Plus,
  X,
  Loader2,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { DeadlineChip, TenderStatusBadge } from '@/components/tenders/TenderBadges';
import { PIPELINE_STAGES, STATUS_TRANSITIONS } from '@/components/tenders/tender-meta';
import { usePermissions } from '@/hooks/usePermission';
import { apiRequest } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  isDone: boolean;
  completedAt?: string | null;
}

interface ActivityEntry {
  id: string;
  action: string;
  message: string;
  createdAt: string;
  user: string | null;
}

interface TenderDetail {
  id: string;
  tenderNumber: string;
  title: string;
  procuringEntity: string;
  category: string;
  procurementMethod: string;
  source?: string | null;
  requiredGrade?: string | null;
  location?: string | null;
  regionOrCity?: string | null;
  description?: string | null;
  status: string;
  winProbability: number;
  estimatedValue: number;
  bidAmount?: number | null;
  documentFee: number;
  bidSecurityAmount: number;
  bidSecurityType?: string | null;
  bidSecurityReturned: boolean;
  publishedDate?: string | null;
  siteVisitDate?: string | null;
  clarificationDeadline?: string | null;
  submissionDeadline: string;
  openingDate?: string | null;
  submittedAt?: string | null;
  decidedAt?: string | null;
  awardedTo?: string | null;
  awardedAmount?: number | null;
  outcomeNotes?: string | null;
  bidManagerId?: string | null;
  bidManager?: { id: string; firstName: string; lastName: string; email: string } | null;
  convertedProject?: { id: string; projectName: string; status: string } | null;
  checklist: ChecklistItem[];
  activity: ActivityEntry[];
}

const TRANSITION_LABELS: Record<string, string> = {
  Identified: 'Reopen',
  Preparing: 'Start Preparing Bid',
  Submitted: 'Mark as Submitted',
  'Under Evaluation': 'Move to Evaluation',
  'No Bid': 'Decide Not to Bid',
  Cancelled: 'Tender Cancelled by Client',
};

function fmtDateTime(v?: string | null) {
  if (!v) return null;
  return new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
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

const inputCls =
  'w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 bg-white';

export default function TenderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { can, canAll } = usePermissions();

  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [newItem, setNewItem] = useState('');
  const [modal, setModal] = useState<null | 'outcome' | 'convert' | { status: string }>(null);

  // Outcome modal state
  const [outcome, setOutcome] = useState<'Won' | 'Lost'>('Won');
  const [awardedAmount, setAwardedAmount] = useState('');
  const [awardedTo, setAwardedTo] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  // Status note / convert modal state
  const [statusNote, setStatusNote] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = useCallback(async () => {
    try {
      setTender(await apiRequest<TenderDetail>(`/tenders/${id}`));
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load tender');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /** Runs a mutating request, then reloads the tender */
  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setActionError(null);
    try {
      await fn();
      await load();
      return true;
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const checklistDone = tender?.checklist.filter((c) => c.isDone).length ?? 0;
  const checklistTotal = tender?.checklist.length ?? 0;
  const readiness = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const variance = useMemo(() => {
    if (!tender?.bidAmount || !tender.estimatedValue) return null;
    return ((tender.bidAmount - tender.estimatedValue) / tender.estimatedValue) * 100;
  }, [tender]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/tenders" className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to tenders
        </Link>
        <div className="p-4 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">{loadError}</div>
      </div>
    );
  }
  if (!tender) return <LoadingState message="Loading tender..." />;

  const transitions = STATUS_TRANSITIONS[tender.status] ?? [];
  const canRecordOutcome = ['Submitted', 'Under Evaluation'].includes(tender.status) && can('tenders:award');
  const canConvert = tender.status === 'Won' && !tender.convertedProject && canAll(['tenders:award', 'projects:create']);
  const stageIndex = PIPELINE_STAGES.indexOf(tender.status as (typeof PIPELINE_STAGES)[number]);
  const isClosed = stageIndex === -1;

  const changeStatus = (status: string, notes?: string) =>
    run(`status:${status}`, () =>
      apiRequest(`/tenders/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes: notes || undefined }) }),
    );

  const onTransition = (status: string) => {
    if (status === 'No Bid' || status === 'Cancelled') {
      setStatusNote('');
      setModal({ status });
      return;
    }
    if (status === 'Submitted' && readiness < 100) {
      const ok = window.confirm(
        `Only ${checklistDone} of ${checklistTotal} bid documents are ticked off. Mark this tender as submitted anyway?`,
      );
      if (!ok) return;
    }
    changeStatus(status);
  };

  const timeline = [
    { label: 'Published', date: tender.publishedDate },
    { label: 'Site visit', date: tender.siteVisitDate },
    { label: 'Clarifications close', date: tender.clarificationDeadline },
    { label: 'Submission deadline', date: tender.submissionDeadline, key: true },
    { label: 'Bid opening', date: tender.openingDate },
  ]
    .filter((e) => e.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Link href="/dashboard/tenders" className="p-1.5 mt-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">{tender.tenderNumber}</span>
              <TenderStatusBadge status={tender.status} />
              <DeadlineChip deadline={tender.submissionDeadline} status={tender.status} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">{tender.title}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Building2 size={12} /> {tender.procuringEntity}</span>
              {(tender.location || tender.regionOrCity) && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {[tender.location, tender.regionOrCity].filter(Boolean).join(', ')}
                </span>
              )}
              <span>{tender.category} · {tender.procurementMethod}</span>
              {tender.requiredGrade && <span className="font-bold text-slate-700 bg-slate-100 rounded px-1.5">{tender.requiredGrade}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {can('tenders:update') && (
            <Link
              href={`/dashboard/tenders/${id}/edit`}
              className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs"
            >
              <Edit3 size={14} /> Edit
            </Link>
          )}
          {can('tenders:delete') && (
            <button
              onClick={async () => {
                if (!window.confirm(`Delete tender ${tender.tenderNumber}? This hides it from the pipeline.`)) return;
                const ok = await run('delete', () => apiRequest(`/tenders/${id}`, { method: 'DELETE' }));
                if (ok) router.push('/dashboard/tenders');
              }}
              className="flex items-center gap-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Stage stepper + actions */}
      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center overflow-x-auto pb-1">
            {[...PIPELINE_STAGES, isClosed ? tender.status : 'Outcome'].map((stage, i, arr) => {
              const reached = isClosed || i <= stageIndex;
              const current = isClosed ? i === arr.length - 1 : i === stageIndex;
              const closedTone =
                tender.status === 'Won' ? 'bg-emerald-500 text-white' : tender.status === 'Lost' ? 'bg-rose-500 text-white' : 'bg-slate-400 text-white';
              return (
                <React.Fragment key={stage}>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black',
                        current && isClosed ? closedTone : current ? 'bg-[#0284c7] text-white ring-4 ring-sky-100' : reached ? 'bg-sky-100 text-[#0284c7]' : 'bg-slate-100 text-slate-400',
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className={cn('text-xs font-semibold', current ? 'text-slate-900' : 'text-slate-400')}>{stage}</span>
                  </div>
                  {i < arr.length - 1 && <ChevronRight size={14} className="mx-2 text-slate-300 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>

          {(transitions.length > 0 || canRecordOutcome || canConvert || tender.convertedProject) && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
              {can('tenders:update') &&
                transitions.map((s) => {
                  const negative = s === 'No Bid' || s === 'Cancelled' || s === 'Identified';
                  return (
                    <button
                      key={s}
                      disabled={!!busy}
                      onClick={() => onTransition(s)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold shadow-xs transition-colors disabled:opacity-60',
                        negative ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-[#0284c7] hover:bg-[#0275b0] text-white',
                      )}
                    >
                      {busy === `status:${s}` && <Loader2 size={13} className="animate-spin" />}
                      {TRANSITION_LABELS[s] ?? s}
                    </button>
                  );
                })}
              {canRecordOutcome && (
                <button
                  onClick={() => {
                    setOutcome('Won');
                    setAwardedAmount(tender.bidAmount ? String(tender.bidAmount) : '');
                    setAwardedTo('');
                    setOutcomeNotes('');
                    setModal('outcome');
                  }}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs"
                >
                  <Trophy size={14} /> Record Award Result
                </button>
              )}
              {canConvert && (
                <button
                  onClick={() => {
                    setProjectCode(tender.tenderNumber);
                    setStartDate('');
                    setEndDate('');
                    setModal('convert');
                  }}
                  className="flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs"
                >
                  <FolderPlus size={14} /> Convert to Project
                </button>
              )}
              {tender.convertedProject && (
                <Link
                  href={`/dashboard/projects/${tender.convertedProject.id}`}
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-md text-xs font-bold"
                >
                  <CheckCircle2 size={14} /> Project: {tender.convertedProject.projectName}
                </Link>
              )}
            </div>
          )}

          {actionError && (
            <div className="p-2.5 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">{actionError}</div>
          )}
        </CardContent>
      </Card>

      {(tender.status === 'Won' || tender.status === 'Lost' || tender.outcomeNotes) && (
        <div
          className={cn(
            'rounded-lg border p-4 text-xs',
            tender.status === 'Won' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : tender.status === 'Lost' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700',
          )}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {tender.status === 'Won' ? <Trophy size={16} /> : tender.status === 'Lost' ? <XCircle size={16} /> : <FileText size={16} />}
            {tender.status === 'Won'
              ? `Awarded${tender.awardedAmount ? ` — ${formatCurrency(tender.awardedAmount)}` : ''}`
              : tender.status === 'Lost'
                ? `Lost${tender.awardedTo ? ` to ${tender.awardedTo}` : ''}${tender.awardedAmount ? ` at ${formatCurrency(tender.awardedAmount)}` : ''}`
                : tender.status}
          </div>
          {tender.outcomeNotes && <p className="mt-1.5 leading-relaxed">{tender.outcomeNotes}</p>}
          {tender.status === 'Lost' && tender.awardedAmount && tender.bidAmount ? (
            <p className="mt-1.5 font-semibold">
              Our bid was {(((tender.bidAmount - tender.awardedAmount) / tender.awardedAmount) * 100).toFixed(1)}% above the winning price.
            </p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Economics */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Banknote size={15} className="text-emerald-600" /> Bid Economics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Engineer&apos;s Estimate</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{formatCurrency(tender.estimatedValue)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Our Bid</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{tender.bidAmount != null ? formatCurrency(tender.bidAmount) : '—'}</p>
                {variance !== null && (
                  <span className={cn('text-[10px] font-bold', variance <= 0 ? 'text-emerald-600' : 'text-amber-600')}>
                    {variance > 0 ? '+' : ''}
                    {variance.toFixed(1)}% vs estimate
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Win Probability</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#0284c7] rounded-full" style={{ width: `${tender.winProbability}%` }} />
                  </div>
                  <span className="font-black text-slate-900">{tender.winProbability}%</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Document Fee</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{formatCurrency(tender.documentFee)}</p>
              </div>
              <div className="col-span-2 md:col-span-4 rounded-md border border-slate-100 bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={tender.bidSecurityReturned ? 'text-emerald-600' : 'text-violet-600'} />
                  <div>
                    <span className="font-bold text-slate-900">
                      Bid security: {formatCurrency(tender.bidSecurityAmount)}
                      {tender.bidSecurityType ? ` (${tender.bidSecurityType})` : ''}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {tender.bidSecurityReturned
                        ? 'Returned by the procuring entity'
                        : ['Submitted', 'Under Evaluation', 'Won', 'Lost'].includes(tender.status)
                          ? 'Held by the procuring entity — follow up for release after award'
                          : 'Not yet lodged'}
                    </span>
                  </div>
                </div>
                {can('tenders:update') && tender.bidSecurityAmount > 0 && (
                  <button
                    disabled={!!busy}
                    onClick={() =>
                      run('security', () =>
                        apiRequest(`/tenders/${id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ bidSecurityReturned: !tender.bidSecurityReturned }),
                        }),
                      )
                    }
                    className="text-[11px] font-bold text-[#0284c7] hover:underline disabled:opacity-60"
                  >
                    {tender.bidSecurityReturned ? 'Mark as still held' : 'Mark as returned'}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarClock size={15} className="text-amber-600" /> Key Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ol className="relative border-l-2 border-slate-100 ml-2 space-y-4">
                {timeline.map((e) => {
                  const past = new Date(e.date!).getTime() < Date.now();
                  return (
                    <li key={e.label} className="ml-4">
                      <span
                        className={cn(
                          'absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-white',
                          e.key ? 'bg-rose-500' : past ? 'bg-slate-300' : 'bg-sky-500',
                        )}
                      />
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className={cn('text-xs font-bold', e.key ? 'text-rose-700' : past ? 'text-slate-400' : 'text-slate-800')}>
                          {e.label}
                        </span>
                        <span className={cn('text-[11px]', past ? 'text-slate-400' : 'text-slate-600')}>{fmtDateTime(e.date)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {tender.submittedAt && (
                <p className="mt-4 text-[11px] text-slate-500">Bid handed in {fmtDateTime(tender.submittedAt)}.</p>
              )}
            </CardContent>
          </Card>

          {tender.description && (
            <Card className="border border-slate-100 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Scope Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-line">{tender.description}</CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Checklist */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ListChecks size={15} className="text-[#0284c7]" /> Bid Documents
                </CardTitle>
                <div className="relative h-10 w-10">
                  <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={readiness === 100 ? '#10b981' : '#0284c7'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(readiness / 100) * 97.4} 97.4`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-700">{readiness}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <ul className="space-y-0.5">
                {tender.checklist.map((item) => (
                  <li key={item.id} className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50">
                    <button
                      disabled={!can('tenders:update') || !!busy}
                      onClick={() =>
                        run(`item:${item.id}`, () =>
                          apiRequest(`/tenders/${id}/checklist/${item.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ isDone: !item.isDone }),
                          }),
                        )
                      }
                      className="flex items-center gap-2 flex-1 text-left disabled:cursor-default"
                    >
                      {busy === `item:${item.id}` ? (
                        <Loader2 size={15} className="animate-spin text-slate-400 shrink-0" />
                      ) : item.isDone ? (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Circle size={15} className="text-slate-300 shrink-0" />
                      )}
                      <span className={cn('text-xs', item.isDone ? 'text-slate-400 line-through' : 'text-slate-700')}>{item.label}</span>
                    </button>
                    {can('tenders:update') && (
                      <button
                        title="Remove"
                        disabled={!!busy}
                        onClick={() => run(`del:${item.id}`, () => apiRequest(`/tenders/${id}/checklist/${item.id}`, { method: 'DELETE' }))}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-rose-500"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {can('tenders:update') && (
                <form
                  className="flex gap-2 p-2 pt-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newItem.trim()) return;
                    const ok = await run('add-item', () =>
                      apiRequest(`/tenders/${id}/checklist`, { method: 'POST', body: JSON.stringify({ label: newItem }) }),
                    );
                    if (ok) setNewItem('');
                  }}
                >
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add document, e.g. JV agreement"
                    className={inputCls}
                  />
                  <button type="submit" disabled={!!busy} className="px-2.5 rounded-md bg-slate-900 text-white disabled:opacity-60">
                    <Plus size={14} />
                  </button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Ownership + activity */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History size={15} className="text-violet-600" /> Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500">Bid manager</span>
                <span className="font-bold text-slate-900">
                  {tender.bidManager ? `${tender.bidManager.firstName} ${tender.bidManager.lastName}` : 'Unassigned'}
                </span>
              </div>
              {tender.source && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-slate-500">Source</span>
                  <span className="font-semibold text-slate-700">{tender.source}</span>
                </div>
              )}
              {tender.activity.length === 0 ? (
                <p className="text-slate-400">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {tender.activity.map((a) => (
                    <li key={a.id} className="leading-snug">
                      <span className="text-slate-800">{a.message}</span>
                      <span className="block text-[10px] text-slate-400">
                        {a.user ?? 'System'} · {fmtDateTime(a.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {modal === 'outcome' && (
        <Modal title="Record Award Result" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(['Won', 'Lost'] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-2.5 rounded-md border text-xs font-bold',
                    outcome === o
                      ? o === 'Won'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-rose-600 border-rose-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {o === 'Won' ? <Trophy size={14} /> : <XCircle size={14} />} {o === 'Won' ? 'We won' : 'We lost'}
                </button>
              ))}
            </div>
            {outcome === 'Lost' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Winning bidder</label>
                <input value={awardedTo} onChange={(e) => setAwardedTo(e.target.value)} placeholder="Competitor name" className={inputCls} />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {outcome === 'Won' ? 'Contract award amount (ETB)' : 'Winning price (ETB), if known'}
              </label>
              <input type="number" min={0} step="0.01" value={awardedAmount} onChange={(e) => setAwardedAmount(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">{outcome === 'Won' ? 'Award notes' : 'Why did we lose?'}</label>
              <textarea rows={3} value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} className={inputCls} />
            </div>
            <button
              disabled={!!busy}
              onClick={async () => {
                const ok = await run('outcome', () =>
                  apiRequest(`/tenders/${id}/outcome`, {
                    method: 'POST',
                    body: JSON.stringify({
                      outcome,
                      awardedAmount: awardedAmount ? Number(awardedAmount) : undefined,
                      awardedTo: outcome === 'Lost' && awardedTo.trim() ? awardedTo.trim() : undefined,
                      outcomeNotes: outcomeNotes.trim() || undefined,
                    }),
                  }),
                );
                if (ok) setModal(null);
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] disabled:opacity-60 text-white py-2 rounded-md text-xs font-bold"
            >
              {busy === 'outcome' && <Loader2 size={13} className="animate-spin" />}
              Save Result
            </button>
            {actionError && <p className="text-[11px] text-rose-600 font-medium">{actionError}</p>}
          </div>
        </Modal>
      )}

      {modal === 'convert' && (
        <Modal title="Convert to Project" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Creates a <b>Planning</b> project for {tender.procuringEntity} with a budget of{' '}
              <b>{formatCurrency(tender.awardedAmount ?? tender.bidAmount ?? tender.estimatedValue)}</b>
              {tender.bidManager ? `, managed by ${tender.bidManager.firstName} ${tender.bidManager.lastName}` : ''}.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Project code</label>
              <input value={projectCode} onChange={(e) => setProjectCode(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Contract start</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Contract end</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <button
              disabled={!!busy}
              onClick={async () => {
                setBusy('convert');
                setActionError(null);
                try {
                  const res = await apiRequest<{ project: { id: string } }>(`/tenders/${id}/convert`, {
                    method: 'POST',
                    body: JSON.stringify({
                      projectCode: projectCode.trim() || undefined,
                      startDate: startDate || undefined,
                      endDate: endDate || undefined,
                    }),
                  });
                  router.push(`/dashboard/projects/${res.project.id}`);
                } catch (err: any) {
                  setActionError(err.message || 'Conversion failed');
                  setBusy(null);
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-60 text-white py-2 rounded-md text-xs font-bold"
            >
              {busy === 'convert' ? <Loader2 size={13} className="animate-spin" /> : <FolderPlus size={14} />}
              Create Project
            </button>
            {actionError && <p className="text-[11px] text-rose-600 font-medium">{actionError}</p>}
          </div>
        </Modal>
      )}

      {modal && typeof modal === 'object' && (
        <Modal title={TRANSITION_LABELS[modal.status] ?? modal.status} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-slate-600">Reason (kept for future bid decisions)</label>
            <textarea
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder={modal.status === 'No Bid' ? 'e.g. Required grade above ours; no idle excavators in the period.' : 'e.g. Client re-advertising with revised scope.'}
              className={inputCls}
            />
            <button
              disabled={!!busy}
              onClick={async () => {
                const ok = await changeStatus(modal.status, statusNote.trim());
                if (ok) setModal(null);
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-2 rounded-md text-xs font-bold"
            >
              {busy && <Loader2 size={13} className="animate-spin" />}
              Confirm
            </button>
            {actionError && <p className="text-[11px] text-rose-600 font-medium">{actionError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
