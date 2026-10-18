'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Gavel, Banknote, CalendarClock, UserCog, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  TENDER_BID_SECURITY_TYPES,
  TENDER_CATEGORIES,
  TENDER_PROCUREMENT_METHODS,
  TENDER_SOURCES,
  toDateInput,
  toDateTimeInput,
} from './tender-meta';

export interface TenderFormValues {
  tenderNumber: string;
  title: string;
  procuringEntity: string;
  category: string;
  procurementMethod: string;
  source: string;
  requiredGrade: string;
  location: string;
  regionOrCity: string;
  description: string;
  winProbability: string;
  estimatedValue: string;
  bidAmount: string;
  documentFee: string;
  bidSecurityAmount: string;
  bidSecurityType: string;
  publishedDate: string;
  siteVisitDate: string;
  clarificationDeadline: string;
  submissionDeadline: string;
  openingDate: string;
  bidManagerId: string;
}

interface BidManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const EMPTY: TenderFormValues = {
  tenderNumber: '',
  title: '',
  procuringEntity: '',
  category: 'Road Construction',
  procurementMethod: 'Open National Bidding',
  source: 'e-GP Portal',
  requiredGrade: '',
  location: '',
  regionOrCity: '',
  description: '',
  winProbability: '50',
  estimatedValue: '',
  bidAmount: '',
  documentFee: '',
  bidSecurityAmount: '',
  bidSecurityType: 'CPO',
  publishedDate: '',
  siteVisitDate: '',
  clarificationDeadline: '',
  submissionDeadline: '',
  openingDate: '',
  bidManagerId: '',
};

/** Converts a tender API record into form values */
export function tenderToFormValues(t: any): TenderFormValues {
  return {
    tenderNumber: t.tenderNumber ?? '',
    title: t.title ?? '',
    procuringEntity: t.procuringEntity ?? '',
    category: t.category ?? EMPTY.category,
    procurementMethod: t.procurementMethod ?? EMPTY.procurementMethod,
    source: t.source ?? '',
    requiredGrade: t.requiredGrade ?? '',
    location: t.location ?? '',
    regionOrCity: t.regionOrCity ?? '',
    description: t.description ?? '',
    winProbability: String(t.winProbability ?? 50),
    estimatedValue: t.estimatedValue ? String(t.estimatedValue) : '',
    bidAmount: t.bidAmount != null ? String(t.bidAmount) : '',
    documentFee: t.documentFee ? String(t.documentFee) : '',
    bidSecurityAmount: t.bidSecurityAmount ? String(t.bidSecurityAmount) : '',
    bidSecurityType: t.bidSecurityType ?? '',
    publishedDate: toDateInput(t.publishedDate),
    siteVisitDate: toDateTimeInput(t.siteVisitDate),
    clarificationDeadline: toDateTimeInput(t.clarificationDeadline),
    submissionDeadline: toDateTimeInput(t.submissionDeadline),
    openingDate: toDateTimeInput(t.openingDate),
    bidManagerId: t.bidManagerId ?? '',
  };
}

/**
 * Builds the API payload. On create, blank optional fields are omitted;
 * on edit, blank nullable fields are sent as null so they can be cleared.
 */
function buildPayload(v: TenderFormValues, mode: 'create' | 'edit') {
  const blank = mode === 'create' ? undefined : null;
  const str = (s: string) => (s.trim() ? s.trim() : blank);
  const num = (s: string) => (s.trim() ? Number(s) : blank);
  const dateTime = (s: string) => (s ? new Date(s).toISOString() : blank);

  const payload: Record<string, unknown> = {
    tenderNumber: v.tenderNumber.trim(),
    title: v.title.trim(),
    procuringEntity: v.procuringEntity.trim(),
    category: v.category,
    procurementMethod: v.procurementMethod,
    source: str(v.source),
    requiredGrade: str(v.requiredGrade),
    location: str(v.location),
    regionOrCity: str(v.regionOrCity),
    description: str(v.description),
    winProbability: Number(v.winProbability),
    estimatedValue: v.estimatedValue.trim() ? Number(v.estimatedValue) : 0,
    bidAmount: num(v.bidAmount),
    documentFee: v.documentFee.trim() ? Number(v.documentFee) : 0,
    bidSecurityAmount: v.bidSecurityAmount.trim() ? Number(v.bidSecurityAmount) : 0,
    bidSecurityType: str(v.bidSecurityType),
    publishedDate: v.publishedDate ? v.publishedDate : blank,
    siteVisitDate: dateTime(v.siteVisitDate),
    clarificationDeadline: dateTime(v.clarificationDeadline),
    submissionDeadline: new Date(v.submissionDeadline).toISOString(),
    openingDate: dateTime(v.openingDate),
    bidManagerId: str(v.bidManagerId),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, val]) => val !== undefined));
}

const inputCls =
  'w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 bg-white';
const labelCls = 'block text-[11px] font-bold text-slate-600 mb-1';

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

interface TenderFormProps {
  mode: 'create' | 'edit';
  initial?: TenderFormValues;
  backHref: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

export default function TenderForm({ mode, initial, backHref, onSubmit }: TenderFormProps) {
  const [values, setValues] = useState<TenderFormValues>(initial ?? EMPTY);
  const [managers, setManagers] = useState<BidManager[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<BidManager[]>('/tenders/users/bid-managers')
      .then(setManagers)
      .catch(() => setManagers([]));
  }, []);

  const set = (key: keyof TenderFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const variance = useMemo(() => {
    const est = Number(values.estimatedValue);
    const bid = Number(values.bidAmount);
    if (!est || !bid) return null;
    return ((bid - est) / est) * 100;
  }, [values.estimatedValue, values.bidAmount]);

  const suggestedSecurity = useMemo(() => {
    const base = Number(values.bidAmount) || Number(values.estimatedValue);
    return base ? Math.round(base * 0.01) : null;
  }, [values.bidAmount, values.estimatedValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!values.submissionDeadline) {
      setError('Submission deadline is required.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(buildPayload(values, mode));
    } catch (err: any) {
      setError(err?.message || 'Failed to save tender.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'create' ? 'Register New Tender' : 'Edit Tender'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'create'
                ? 'Capture a bid opportunity. A standard Ethiopian bid-document checklist is attached automatically.'
                : 'Update tender details, bid price, and key dates.'}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] disabled:opacity-60 text-white px-4 py-2 rounded-md text-xs font-bold shadow-xs transition-colors"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {mode === 'create' ? 'Register Tender' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Gavel size={15} className="text-[#0284c7]" /> Tender Identity
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">As published by the procuring entity.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tender / Reference Number *">
            <input required value={values.tenderNumber} onChange={set('tenderNumber')} placeholder="ERA/NCB/W-014/2026" className={inputCls} />
          </Field>
          <Field label="Procuring Entity (Client) *">
            <input required value={values.procuringEntity} onChange={set('procuringEntity')} placeholder="Ethiopian Roads Administration" className={inputCls} />
          </Field>
          <Field label="Tender Title *" className="md:col-span-2">
            <input required value={values.title} onChange={set('title')} placeholder="Asphalt upgrading of Modjo – Ziway link road (32 km)" className={inputCls} />
          </Field>
          <Field label="Category *">
            <select value={values.category} onChange={set('category')} className={inputCls}>
              {TENDER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Procurement Method">
            <select value={values.procurementMethod} onChange={set('procurementMethod')} className={inputCls}>
              {TENDER_PROCUREMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Where We Found It">
            <select value={values.source} onChange={set('source')} className={inputCls}>
              <option value="">Not specified</option>
              {TENDER_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Required Contractor Grade" hint="e.g. GC-1, BC-3, RC-2">
            <input value={values.requiredGrade} onChange={set('requiredGrade')} placeholder="GC-1" className={inputCls} />
          </Field>
          <Field label="Site Location">
            <input value={values.location} onChange={set('location')} placeholder="Modjo – Ziway corridor" className={inputCls} />
          </Field>
          <Field label="Region / City">
            <input value={values.regionOrCity} onChange={set('regionOrCity')} placeholder="Oromia" className={inputCls} />
          </Field>
          <Field label="Scope Summary" className="md:col-span-2">
            <textarea value={values.description} onChange={set('description')} rows={3} placeholder="Key scope items, quantities, special conditions..." className={inputCls} />
          </Field>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Banknote size={15} className="text-emerald-600" /> Bid Economics
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">All amounts in ETB.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Engineer's Estimate / Budget">
            <input type="number" min={0} step="0.01" value={values.estimatedValue} onChange={set('estimatedValue')} placeholder="185000000" className={inputCls} />
          </Field>
          <Field label="Our Bid Amount" hint="Required before marking as submitted">
            <input type="number" min={0} step="0.01" value={values.bidAmount} onChange={set('bidAmount')} placeholder="172500000" className={inputCls} />
          </Field>
          <div className="rounded-md bg-slate-50 border border-slate-100 p-3 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bid vs Estimate</span>
            {variance === null ? (
              <span className="text-xs text-slate-400 mt-1">Enter both amounts</span>
            ) : (
              <span className={`text-lg font-black mt-0.5 ${variance <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {variance > 0 ? '+' : ''}
                {variance.toFixed(1)}%
                <span className="text-[10px] font-semibold text-slate-500 ml-1.5">
                  {variance <= 0 ? 'below estimate' : 'above estimate'}
                </span>
              </span>
            )}
          </div>
          <Field label="Bid Security Amount" hint={suggestedSecurity ? `Typical 1%: ${formatCurrency(suggestedSecurity)}` : undefined}>
            <input type="number" min={0} step="0.01" value={values.bidSecurityAmount} onChange={set('bidSecurityAmount')} placeholder="2000000" className={inputCls} />
          </Field>
          <Field label="Bid Security Form">
            <select value={values.bidSecurityType} onChange={set('bidSecurityType')} className={inputCls}>
              <option value="">Not specified</option>
              {TENDER_BID_SECURITY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Bid Document Fee">
            <input type="number" min={0} step="0.01" value={values.documentFee} onChange={set('documentFee')} placeholder="500" className={inputCls} />
          </Field>
          <Field label={`Win Probability — ${values.winProbability}%`} className="md:col-span-3">
            <input type="range" min={0} max={100} step={5} value={values.winProbability} onChange={set('winProbability')} className="w-full accent-[#0284c7]" />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Long shot</span>
              <span>Competitive</span>
              <span>Strong favourite</span>
            </div>
          </Field>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border border-slate-100 shadow-xs lg:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock size={15} className="text-amber-600" /> Key Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Published On">
              <input type="date" value={values.publishedDate} onChange={set('publishedDate')} className={inputCls} />
            </Field>
            <Field label="Mandatory Site Visit">
              <input type="datetime-local" value={values.siteVisitDate} onChange={set('siteVisitDate')} className={inputCls} />
            </Field>
            <Field label="Clarification Deadline">
              <input type="datetime-local" value={values.clarificationDeadline} onChange={set('clarificationDeadline')} className={inputCls} />
            </Field>
            <Field label="Submission Deadline *">
              <input required type="datetime-local" value={values.submissionDeadline} onChange={set('submissionDeadline')} className={`${inputCls} border-rose-200`} />
            </Field>
            <Field label="Bid Opening">
              <input type="datetime-local" value={values.openingDate} onChange={set('openingDate')} className={inputCls} />
            </Field>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCog size={15} className="text-violet-600" /> Ownership
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Field label="Bid Manager" hint="Becomes the default project manager if the tender is won.">
              <select value={values.bidManagerId} onChange={set('bidManagerId')} className={inputCls}>
                <option value="">Unassigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </Field>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
