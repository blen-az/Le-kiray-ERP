'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Ban, Trash2, Loader2, ExternalLink, Search, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { Modal } from '@/components/users/UsersPanel';
import { DeadlineChip } from '@/components/tenders/TenderBadges';
import {
  TENDER_BID_SECURITY_TYPES,
  TENDER_CATEGORIES,
  TENDER_PROCUREMENT_METHODS,
  TENDER_SOURCES,
  formatCompactETB,
  toDateInput,
  toDateTimeInput,
} from '@/components/tenders/tender-meta';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notice {
  id: string;
  tenderNumber: string;
  title: string;
  procuringEntity: string;
  category: string;
  procurementMethod: string;
  source: string | null;
  sourceUrl: string | null;
  requiredGrade: string | null;
  location: string | null;
  regionOrCity: string | null;
  description: string | null;
  estimatedValue: number | null;
  documentFee: number | null;
  bidSecurityAmount: number | null;
  bidSecurityType: string | null;
  publishedDate: string | null;
  siteVisitDate: string | null;
  clarificationDeadline: string | null;
  submissionDeadline: string;
  openingDate: string | null;
  status: string;
  trackedCount: number;
}

const EMPTY = {
  tenderNumber: '',
  title: '',
  procuringEntity: '',
  category: 'Road Construction',
  procurementMethod: 'Open National Bidding',
  source: 'e-GP Portal',
  sourceUrl: '',
  requiredGrade: '',
  location: '',
  regionOrCity: '',
  description: '',
  estimatedValue: '',
  documentFee: '',
  bidSecurityAmount: '',
  bidSecurityType: 'CPO',
  publishedDate: '',
  siteVisitDate: '',
  clarificationDeadline: '',
  submissionDeadline: '',
  openingDate: '',
};
type Form = typeof EMPTY;

const inputCls =
  'w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 bg-white';

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function toForm(n: Notice): Form {
  return {
    tenderNumber: n.tenderNumber,
    title: n.title,
    procuringEntity: n.procuringEntity,
    category: n.category,
    procurementMethod: n.procurementMethod,
    source: n.source ?? '',
    sourceUrl: n.sourceUrl ?? '',
    requiredGrade: n.requiredGrade ?? '',
    location: n.location ?? '',
    regionOrCity: n.regionOrCity ?? '',
    description: n.description ?? '',
    estimatedValue: n.estimatedValue != null ? String(n.estimatedValue) : '',
    documentFee: n.documentFee != null ? String(n.documentFee) : '',
    bidSecurityAmount: n.bidSecurityAmount != null ? String(n.bidSecurityAmount) : '',
    bidSecurityType: n.bidSecurityType ?? '',
    publishedDate: toDateInput(n.publishedDate),
    siteVisitDate: toDateTimeInput(n.siteVisitDate),
    clarificationDeadline: toDateTimeInput(n.clarificationDeadline),
    submissionDeadline: toDateTimeInput(n.submissionDeadline),
    openingDate: toDateTimeInput(n.openingDate),
  };
}

/** Blank optional fields are omitted when posting, and sent as null when editing so they can be cleared */
function toPayload(f: Form, editing: boolean) {
  const blank = editing ? null : undefined;
  const str = (s: string) => (s.trim() ? s.trim() : blank);
  const num = (s: string) => (s.trim() ? Number(s) : blank);
  const dt = (s: string) => (s ? new Date(s).toISOString() : blank);
  const payload: Record<string, unknown> = {
    tenderNumber: f.tenderNumber.trim(),
    title: f.title.trim(),
    procuringEntity: f.procuringEntity.trim(),
    category: f.category,
    procurementMethod: f.procurementMethod,
    source: str(f.source),
    sourceUrl: str(f.sourceUrl),
    requiredGrade: str(f.requiredGrade),
    location: str(f.location),
    regionOrCity: str(f.regionOrCity),
    description: str(f.description),
    estimatedValue: num(f.estimatedValue),
    documentFee: num(f.documentFee),
    bidSecurityAmount: num(f.bidSecurityAmount),
    bidSecurityType: str(f.bidSecurityType),
    publishedDate: f.publishedDate ? f.publishedDate : blank,
    siteVisitDate: dt(f.siteVisitDate),
    clarificationDeadline: dt(f.clarificationDeadline),
    submissionDeadline: new Date(f.submissionDeadline).toISOString(),
    openingDate: dt(f.openingDate),
  };
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
}

export default function TenderNoticesPanel() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<null | { notice: Notice | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setNotices(await apiRequest<Notice[]>('/platform/tender-notices'));
    } catch (err: any) {
      setError(err.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notices.filter(
      (n) => !q || n.title.toLowerCase().includes(q) || n.tenderNumber.toLowerCase().includes(q) || n.procuringEntity.toLowerCase().includes(q),
    );
  }, [notices, search]);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setBusy('form');
    setFormError(null);
    try {
      const editing = !!modal.notice;
      await apiRequest(editing ? `/platform/tender-notices/${modal.notice!.id}` : '/platform/tender-notices', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(toPayload(form, editing)),
      });
      await load();
      setModal(null);
    } catch (err: any) {
      setFormError(err.message || 'Could not save notice');
    } finally {
      setBusy(null);
    }
  };

  const cancelNotice = async (n: Notice) => {
    if (!window.confirm(`Mark "${n.title}" as cancelled by the client? It leaves the board, and the ${n.trackedCount} companies tracking it are notified on their copy.`)) return;
    setBusy(`cancel:${n.id}`);
    try {
      await apiRequest(`/platform/tender-notices/${n.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Cancelled' }) });
      await load();
    } catch (err: any) {
      window.alert(err.message || 'Could not cancel notice');
    } finally {
      setBusy(null);
    }
  };

  const removeNotice = async (n: Notice) => {
    if (!window.confirm(`Remove "${n.title}" from the board? Use this for mistakes. Companies keep any copy they already track.`)) return;
    setBusy(`remove:${n.id}`);
    try {
      await apiRequest(`/platform/tender-notices/${n.id}`, { method: 'DELETE' });
      await load();
    } catch (err: any) {
      window.alert(err.message || 'Could not remove notice');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingState message="Loading Tender Board..." />;

  return (
    <div className="space-y-4">
      {error && <div className="p-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 bg-white"
          />
        </div>
        <button
          onClick={() => {
            setForm(EMPTY);
            setFormError(null);
            setModal({ notice: null });
          }}
          className="flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-bold shadow-xs"
        >
          <Plus size={15} /> Post Tender Notice
        </button>
      </div>

      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Tender</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4 text-right">Estimate</th>
                <th className="py-3 px-4 text-center">Companies tracking</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Megaphone size={24} className="mx-auto mb-2 opacity-40" />
                    No notices yet. Post the first tender for all companies to see.
                  </td>
                </tr>
              ) : (
                filtered.map((n) => {
                  const past = new Date(n.submissionDeadline).getTime() < Date.now();
                  const label = n.status === 'Cancelled' ? 'Cancelled' : past ? 'Closed' : 'Open';
                  return (
                    <tr key={n.id} className={cn('hover:bg-slate-50/50', label !== 'Open' && 'opacity-70')}>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">{n.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">{n.tenderNumber}</span>
                        {n.sourceUrl && (
                          <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-[#0284c7] hover:underline">
                            source <ExternalLink size={9} />
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">{n.procuringEntity}</td>
                      <td className="py-3 px-4">
                        <DeadlineChip deadline={n.submissionDeadline} status={label === 'Open' ? 'Identified' : 'Closed'} />
                      </td>
                      <td className="py-3 px-4 text-right">{n.estimatedValue ? formatCompactETB(n.estimatedValue) : '—'}</td>
                      <td className="py-3 px-4 text-center font-bold tabular-nums">{n.trackedCount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            label === 'Open' ? 'bg-emerald-50 text-emerald-700' : label === 'Cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <button
                            title="Edit (date changes are copied to companies still preparing)"
                            onClick={() => {
                              setForm(toForm(n));
                              setFormError(null);
                              setModal({ notice: n });
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Edit3 size={14} />
                          </button>
                          {n.status !== 'Cancelled' && (
                            <button
                              title="Mark cancelled by client"
                              disabled={!!busy}
                              onClick={() => cancelNotice(n)}
                              className="p-1.5 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                            >
                              {busy === `cancel:${n.id}` ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                            </button>
                          )}
                          <button
                            title="Remove from board"
                            disabled={!!busy}
                            onClick={() => removeNotice(n)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {busy === `remove:${n.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
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

      {modal && (
        <Modal title={modal.notice ? 'Edit Tender Notice' : 'Post Tender Notice'} onClose={() => setModal(null)} wide>
          <form onSubmit={submit} className="space-y-3">
            <p className="text-[11px] text-slate-500">Every company on Le&apos;Kiray sees this notice. Only publish facts from the official notice.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Reference number *">
                <input required value={form.tenderNumber} onChange={set('tenderNumber')} placeholder="ERA/NCB/W-014/2026" className={inputCls} />
              </Field>
              <Field label="Procuring entity *">
                <input required value={form.procuringEntity} onChange={set('procuringEntity')} placeholder="Ethiopian Roads Administration" className={inputCls} />
              </Field>
              <Field label="Title *" className="col-span-2">
                <input required value={form.title} onChange={set('title')} className={inputCls} />
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={set('category')} className={inputCls}>
                  {TENDER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Procurement method">
                <select value={form.procurementMethod} onChange={set('procurementMethod')} className={inputCls}>
                  {TENDER_PROCUREMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Published in">
                <select value={form.source} onChange={set('source')} className={inputCls}>
                  <option value="">Not specified</option>
                  {TENDER_SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Link to original notice">
                <input type="url" value={form.sourceUrl} onChange={set('sourceUrl')} placeholder="https://..." className={inputCls} />
              </Field>
              <Field label="Minimum contractor grade">
                <input value={form.requiredGrade} onChange={set('requiredGrade')} placeholder="GC-1" className={inputCls} />
              </Field>
              <Field label="Region / City">
                <input value={form.regionOrCity} onChange={set('regionOrCity')} placeholder="Oromia" className={inputCls} />
              </Field>
              <Field label="Site location" className="col-span-2">
                <input value={form.location} onChange={set('location')} className={inputCls} />
              </Field>
              <Field label="Scope summary" className="col-span-2">
                <textarea rows={2} value={form.description} onChange={set('description')} className={inputCls} />
              </Field>
              <Field label="Estimated value (ETB)">
                <input type="number" min={0} value={form.estimatedValue} onChange={set('estimatedValue')} className={inputCls} />
              </Field>
              <Field label="Document fee (ETB)">
                <input type="number" min={0} value={form.documentFee} onChange={set('documentFee')} className={inputCls} />
              </Field>
              <Field label="Bid security (ETB)">
                <input type="number" min={0} value={form.bidSecurityAmount} onChange={set('bidSecurityAmount')} className={inputCls} />
              </Field>
              <Field label="Bid security form">
                <select value={form.bidSecurityType} onChange={set('bidSecurityType')} className={inputCls}>
                  <option value="">Not specified</option>
                  {TENDER_BID_SECURITY_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Published on">
                <input type="date" value={form.publishedDate} onChange={set('publishedDate')} className={inputCls} />
              </Field>
              <Field label="Site visit">
                <input type="datetime-local" value={form.siteVisitDate} onChange={set('siteVisitDate')} className={inputCls} />
              </Field>
              <Field label="Clarification deadline">
                <input type="datetime-local" value={form.clarificationDeadline} onChange={set('clarificationDeadline')} className={inputCls} />
              </Field>
              <Field label="Submission deadline *">
                <input required type="datetime-local" value={form.submissionDeadline} onChange={set('submissionDeadline')} className={`${inputCls} border-rose-200`} />
              </Field>
              <Field label="Bid opening">
                <input type="datetime-local" value={form.openingDate} onChange={set('openingDate')} className={inputCls} />
              </Field>
            </div>
            {modal.notice && modal.notice.trackedCount > 0 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-2">
                {modal.notice.trackedCount} companies track this tender. Date changes are copied to those still preparing their bid, with a note in their activity log.
              </p>
            )}
            {formError && <p className="text-[11px] text-rose-600 font-medium">{formError}</p>}
            <button
              type="submit"
              disabled={busy === 'form'}
              className="w-full flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] disabled:opacity-50 text-white py-2 rounded-md text-xs font-bold"
            >
              {busy === 'form' && <Loader2 size={13} className="animate-spin" />}
              {modal.notice ? 'Save notice' : 'Publish to all companies'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
