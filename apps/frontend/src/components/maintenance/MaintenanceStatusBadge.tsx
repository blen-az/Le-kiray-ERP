import React from 'react';

interface MaintenanceStatusBadgeProps {
  status?: string;
  className?: string;
}

export function MaintenanceStatusBadge({ status = 'Reported', className = '' }: MaintenanceStatusBadgeProps) {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  const normalized = status.toLowerCase();

  if (normalized === 'reported') {
    style = 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
  } else if (normalized === 'scheduled') {
    style = 'bg-sky-50 text-sky-800 border-sky-200 font-semibold';
  } else if (normalized === 'in progress' || normalized === 'in_progress' || normalized === 'under maintenance') {
    style = 'bg-amber-50 text-amber-900 border-amber-300 font-bold animate-pulse';
  } else if (normalized === 'completed') {
    style = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
  } else if (normalized === 'cancelled') {
    style = 'bg-slate-100 text-slate-500 border-slate-200 line-through';
  } else if (normalized === 'deferred') {
    style = 'bg-purple-50 text-purple-800 border-purple-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${style} ${className}`}
    >
      {status}
    </span>
  );
}
