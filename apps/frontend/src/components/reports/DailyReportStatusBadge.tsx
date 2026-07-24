import React from 'react';

interface DailyReportStatusBadgeProps {
  status?: string;
  className?: string;
}

export function DailyReportStatusBadge({ status = 'Draft', className = '' }: DailyReportStatusBadgeProps) {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  const normalized = status.toLowerCase();

  if (normalized === 'submitted') {
    style = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (normalized === 'approved') {
    style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (normalized === 'rejected') {
    style = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (normalized === 'cancelled') {
    style = 'bg-slate-100 text-slate-500 border-slate-200';
  } else if (normalized === 'missing') {
    style = 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${style} ${className}`}
    >
      {status}
    </span>
  );
}
