import React from 'react';

interface ExpenseStatusBadgeProps {
  status?: string;
  className?: string;
}

export function ExpenseStatusBadge({ status = 'Recorded', className = '' }: ExpenseStatusBadgeProps) {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  const normalized = status.toLowerCase();

  if (normalized === 'draft') {
    style = 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (normalized === 'recorded') {
    style = 'bg-sky-50 text-sky-900 border-sky-200 font-semibold';
  } else if (normalized === 'approved') {
    style = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
  } else if (normalized === 'rejected') {
    style = 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
  } else if (normalized === 'cancelled') {
    style = 'bg-slate-100 text-slate-400 border-slate-200 line-through';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${style} ${className}`}
    >
      {status}
    </span>
  );
}
