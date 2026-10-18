'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, MapPin, ExternalLink, Search, Megaphone, Plus, CheckCircle2, Loader2, Inbox, ShieldCheck } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { DeadlineChip, TenderStatusBadge } from '@/components/tenders/TenderBadges';
import { TENDER_CATEGORIES, formatCompactETB } from '@/components/tenders/tender-meta';
import { usePermissions } from '@/hooks/usePermission';
import { apiRequest } from '@/lib/api';

export interface TenderNotice {
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
  bidSecurityAmount: number | null;
  bidSecurityType: string | null;
  siteVisitDate: string | null;
  submissionDeadline: string;
  createdAt: string;
  trackedTender: { id: string; status: string } | null;
}

const NEW_DAYS = 3;

export default function TenderBoardPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canTrack = can('tenders:create');

  const [notices, setNotices] = useState<TenderNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [onlyUntracked, setOnlyUntracked] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<{ id: string; message: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setNotices(await apiRequest<TenderNotice[]>('/tenders/board'));
    } catch (err: any) {
      setError(err.message || 'Failed to load the Tender Board');
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
      (n) =>
        (!q ||
          n.title.toLowerCase().includes(q) ||
          n.tenderNumber.toLowerCase().includes(q) ||
          n.procuringEntity.toLowerCase().includes(q) ||
          (n.regionOrCity ?? '').toLowerCase().includes(q)) &&
        (category === 'ALL' || n.category === category) &&
        (!onlyUntracked || !n.trackedTender),
    );
  }, [notices, search, category, onlyUntracked]);

  const track = async (n: TenderNotice) => {
    setBusy(n.id);
    setTrackError(null);
    try {
      const created = await apiRequest<{ id: string }>(`/tenders/board/${n.id}/track`, { method: 'POST' });
      router.push(`/dashboard/tenders/${created.id}`);
    } catch (err: any) {
      setTrackError({ id: n.id, message: err.message || 'Could not track this tender' });
      setBusy(null);
      load();
    }
  };

  if (loading) return <LoadingState message="Loading Tender Board..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/tenders" className="p-1.5 mt-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Megaphone size={22} className="text-[#0284c7]" />
            Tender Board
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Open tenders published by Le&apos;Kiray for all contractors. Track one to add it to your company&apos;s private bid pipeline.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-md bg-sky-50 border border-sky-100 text-xs text-sky-900">
        <ShieldCheck size={15} className="shrink-0 mt-0.5" />
        <span>Other companies see the same notices, but never whether you track them, your bid price, your documents or your result.</span>
      </div>

      {error && <div className="p-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, reference, client, region..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 bg-white"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-700">
          <option value="ALL">All Categories</option>
          {TENDER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-700 cursor-pointer">
          <input type="checkbox" className="accent-[#0284c7]" checked={onlyUntracked} onChange={(e) => setOnlyUntracked(e.target.checked)} />
          Hide ones we track
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Inbox size={36} className="text-slate-300 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">{notices.length ? 'No tenders match your filters' : 'No open tenders right now'}</h3>
          <p className="text-xs text-slate-500 mt-1">New opportunities appear here as soon as Le&apos;Kiray publishes them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((n) => {
            const isNew = Date.now() - new Date(n.createdAt).getTime() < NEW_DAYS * 86_400_000;
            return (
              <div key={n.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-slate-400 truncate">{n.tenderNumber}</span>
                    {isNew && <span className="text-[9px] font-black uppercase tracking-wider bg-[#0284c7] text-white rounded px-1.5 py-0.5">New</span>}
                  </div>
                  <DeadlineChip deadline={n.submissionDeadline} status="Identified" />
                </div>
                <h3 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">{n.title}</h3>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><Building2 size={11} /> {n.procuringEntity}</span>
                  {(n.location || n.regionOrCity) && (
                    <span className="flex items-center gap-1"><MapPin size={11} /> {[n.location, n.regionOrCity].filter(Boolean).join(', ')}</span>
                  )}
                </div>
                {n.description && <p className="mt-2 text-xs text-slate-600 line-clamp-2">{n.description}</p>}

                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Estimate</span>
                    <span className="font-bold text-slate-900">{n.estimatedValue ? formatCompactETB(n.estimatedValue) : '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Min. grade</span>
                    <span className="font-bold text-slate-900">{n.requiredGrade ?? 'Any'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Bid security</span>
                    <span className="font-bold text-slate-900">
                      {n.bidSecurityAmount ? formatCompactETB(n.bidSecurityAmount) : '—'}
                      {n.bidSecurityType ? ` ${n.bidSecurityType}` : ''}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 mt-3">
                  <span className="text-[10px] text-slate-500">
                    {n.category}
                    {n.sourceUrl && (
                      <>
                        {' · '}
                        <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[#0284c7] hover:underline">
                          Original notice <ExternalLink size={10} />
                        </a>
                      </>
                    )}
                  </span>
                  {n.trackedTender ? (
                    <Link
                      href={`/dashboard/tenders/${n.trackedTender.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold"
                    >
                      <CheckCircle2 size={13} /> Tracking · <TenderStatusBadge status={n.trackedTender.status} className="border-0 px-0 bg-transparent" />
                    </Link>
                  ) : canTrack ? (
                    <button
                      onClick={() => track(n)}
                      disabled={!!busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0284c7] hover:bg-[#0275b0] disabled:opacity-60 text-white text-xs font-bold"
                    >
                      {busy === n.id ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Track this tender
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">Ask your manager to track it</span>
                  )}
                </div>
                {trackError?.id === n.id && <p className="mt-2 text-[11px] text-rose-600 font-medium">{trackError.message}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
