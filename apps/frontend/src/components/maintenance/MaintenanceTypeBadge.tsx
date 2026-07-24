import React from 'react';
import { Wrench, ShieldCheck, Zap, Disc, Gauge, RefreshCw } from 'lucide-react';

interface MaintenanceTypeBadgeProps {
  type?: string;
  className?: string;
}

export function MaintenanceTypeBadge({ type = 'General Service', className = '' }: MaintenanceTypeBadgeProps) {
  let icon = <Wrench size={12} className="text-slate-500" />;
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  const normalized = type.toLowerCase();

  if (normalized.includes('breakdown')) {
    icon = <Wrench size={12} className="text-rose-600" />;
    style = 'bg-rose-50 text-rose-800 border-rose-200 font-bold';
  } else if (normalized.includes('preventive')) {
    icon = <ShieldCheck size={12} className="text-emerald-600" />;
    style = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
  } else if (normalized.includes('oil')) {
    icon = <RefreshCw size={12} className="text-amber-600" />;
    style = 'bg-amber-50 text-amber-900 border-amber-200';
  } else if (normalized.includes('tire')) {
    icon = <Disc size={12} className="text-slate-700" />;
    style = 'bg-slate-100 text-slate-800 border-slate-300';
  } else if (normalized.includes('electrical')) {
    icon = <Zap size={12} className="text-amber-500" />;
    style = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (normalized.includes('hydraulic')) {
    icon = <Gauge size={12} className="text-sky-600" />;
    style = 'bg-sky-50 text-sky-900 border-sky-200';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${style} ${className}`}
    >
      {icon}
      {type}
    </span>
  );
}
