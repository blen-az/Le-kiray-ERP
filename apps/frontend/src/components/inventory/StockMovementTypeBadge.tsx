import React from 'react';

interface Props {
  type: string;
  className?: string;
}

export function StockMovementTypeBadge({ type, className = '' }: Props) {
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = type;

  switch (type) {
    case 'STOCK_IN':
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      label = 'STOCK IN';
      break;
    case 'STOCK_OUT':
      styles = 'bg-sky-50 text-sky-800 border-sky-300 font-bold';
      label = 'STOCK OUT';
      break;
    case 'TRANSFER':
      styles = 'bg-indigo-50 text-indigo-800 border-indigo-300 font-bold';
      label = 'TRANSFER';
      break;
    case 'ADJUSTMENT_IN':
      styles = 'bg-teal-50 text-teal-800 border-teal-300';
      label = 'ADJUSTMENT (+)';
      break;
    case 'ADJUSTMENT_OUT':
      styles = 'bg-purple-50 text-purple-800 border-purple-300';
      label = 'ADJUSTMENT (-)';
      break;
    case 'RETURN':
      styles = 'bg-blue-50 text-blue-800 border-blue-300';
      label = 'RETURN';
      break;
    case 'DAMAGED':
    case 'LOST':
      styles = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
      break;
    case 'FUEL_ISSUE':
      styles = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      label = 'FUEL ISSUE';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase border font-semibold ${styles} ${className}`}>
      {label}
    </span>
  );
}
