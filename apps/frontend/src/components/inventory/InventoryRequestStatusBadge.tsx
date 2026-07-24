import React from 'react';

interface Props {
  status: string;
  className?: string;
}

export function InventoryRequestStatusBadge({ status, className = '' }: Props) {
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status?.toLowerCase()) {
    case 'pending':
      styles = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      break;
    case 'approved':
      styles = 'bg-sky-50 text-sky-800 border-sky-300 font-bold';
      break;
    case 'issued':
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      break;
    case 'partially issued':
    case 'partially_issued':
      styles = 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
      break;
    case 'rejected':
      styles = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
      break;
    case 'cancelled':
      styles = 'bg-slate-100 text-slate-500 border-slate-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase border font-bold tracking-wider ${styles} ${className}`}>
      {status}
    </span>
  );
}
