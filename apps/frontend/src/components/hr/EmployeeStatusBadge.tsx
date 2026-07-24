import React from 'react';

interface EmployeeStatusBadgeProps {
  status?: string;
  className?: string;
}

export function EmployeeStatusBadge({ status = 'Active', className = '' }: EmployeeStatusBadgeProps) {
  let style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  const normalized = status.toLowerCase();

  if (normalized === 'inactive') {
    style = 'bg-slate-100 text-slate-700 border-slate-200';
  } else if (normalized === 'on leave') {
    style = 'bg-sky-50 text-sky-800 border-sky-200';
  } else if (normalized === 'suspended') {
    style = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (normalized === 'terminated' || normalized === 'resigned') {
    style = 'bg-rose-50 text-rose-800 border-rose-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style} ${className}`}
    >
      {status}
    </span>
  );
}
