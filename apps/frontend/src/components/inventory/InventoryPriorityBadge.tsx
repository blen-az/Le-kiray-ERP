import React from 'react';

interface Props {
  priority: string;
  className?: string;
}

export function InventoryPriorityBadge({ priority, className = '' }: Props) {
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (priority?.toLowerCase()) {
    case 'urgent':
      styles = 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold animate-pulse';
      break;
    case 'high':
      styles = 'bg-orange-50 text-orange-800 border-orange-300 font-bold';
      break;
    case 'normal':
      styles = 'bg-slate-100 text-slate-800 border-slate-200';
      break;
    case 'low':
      styles = 'bg-slate-50 text-slate-600 border-slate-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase border font-semibold ${styles} ${className}`}>
      {priority}
    </span>
  );
}
