import React from 'react';
import { AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface MaintenancePriorityBadgeProps {
  priority?: string;
  className?: string;
}

export function MaintenancePriorityBadge({ priority = 'Normal', className = '' }: MaintenancePriorityBadgeProps) {
  let icon = null;
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  const normalized = priority.toLowerCase();

  if (normalized === 'critical') {
    icon = <ShieldAlert size={12} className="text-rose-600" />;
    style = 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold';
  } else if (normalized === 'urgent') {
    icon = <AlertTriangle size={12} className="text-orange-600" />;
    style = 'bg-orange-50 text-orange-900 border-orange-200 font-bold';
  } else if (normalized === 'high') {
    icon = <AlertCircle size={12} className="text-amber-600" />;
    style = 'bg-amber-50 text-amber-900 border-amber-200 font-semibold';
  } else if (normalized === 'normal') {
    style = 'bg-sky-50 text-sky-800 border-sky-200';
  } else if (normalized === 'low') {
    style = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${style} ${className}`}
    >
      {icon}
      {priority}
    </span>
  );
}
