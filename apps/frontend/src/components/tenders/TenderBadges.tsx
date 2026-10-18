'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAGE_STYLES, describeDeadline } from './tender-meta';

export function TenderStatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STAGE_STYLES[status] ?? STAGE_STYLES.Identified;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        style.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {status}
    </span>
  );
}

/** Live countdown chip that re-renders every minute */
export function DeadlineChip({ deadline, status, className }: { deadline: string; status: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const { label, tone } = describeDeadline(deadline, status, now);
  const Icon = tone === 'overdue' || tone === 'critical' ? AlertTriangle : tone === 'closed' ? CalendarCheck : Clock;

  return (
    <span
      title={`Submission deadline: ${new Date(deadline).toLocaleString()}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap',
        {
          'bg-rose-600 text-white': tone === 'overdue',
          'bg-rose-50 text-rose-700 ring-1 ring-rose-200 animate-pulse': tone === 'critical',
          'bg-amber-50 text-amber-700 ring-1 ring-amber-200': tone === 'soon',
          'bg-slate-50 text-slate-600 ring-1 ring-slate-200': tone === 'normal',
          'bg-transparent text-slate-500': tone === 'closed',
        },
        className,
      )}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

/** Thin bar showing bid-document readiness */
export function ReadinessBar({ done, total, className }: { done: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-sky-500' : 'bg-amber-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
        {done}/{total} docs
      </span>
    </div>
  );
}
