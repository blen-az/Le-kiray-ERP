import React from 'react';

interface EmploymentTypeBadgeProps {
  type?: string;
  className?: string;
}

export function EmploymentTypeBadge({ type = 'Permanent', className = '' }: EmploymentTypeBadgeProps) {
  let style = 'bg-sky-50 text-[#0284c7] border-sky-200';
  const normalized = type.toLowerCase();

  if (normalized.includes('daily laborer')) {
    style = 'bg-amber-50 text-amber-900 border-amber-200';
  } else if (normalized.includes('contract')) {
    style = 'bg-indigo-50 text-indigo-800 border-indigo-200';
  } else if (normalized.includes('temporary') || normalized.includes('intern')) {
    style = 'bg-purple-50 text-purple-800 border-purple-200';
  } else if (normalized.includes('consultant')) {
    style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${style} ${className}`}
    >
      {type}
    </span>
  );
}
