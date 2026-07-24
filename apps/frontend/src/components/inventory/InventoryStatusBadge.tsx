import React from 'react';

interface Props {
  status: string;
  className?: string;
}

export function InventoryStatusBadge({ status, className = '' }: Props) {
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status?.toLowerCase()) {
    case 'active':
      badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'low stock':
    case 'low_stock':
      badgeStyles = 'bg-amber-50 text-amber-800 border-amber-300 font-bold animate-pulse';
      break;
    case 'out of stock':
    case 'out_of_stock':
      badgeStyles = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      break;
    case 'inactive':
      badgeStyles = 'bg-slate-100 text-slate-500 border-slate-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeStyles} ${className}`}>
      {status}
    </span>
  );
}
