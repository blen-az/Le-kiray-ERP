import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CostRiskBadgeProps {
  status?: string;
  className?: string;
}

export function CostRiskBadge({ status = 'On Track', className = '' }: CostRiskBadgeProps) {
  let icon = <CheckCircle2 size={12} className="text-emerald-600" />;
  let style = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
  const normalized = status.toLowerCase();

  if (normalized.includes('over budget')) {
    icon = <ShieldAlert size={12} className="text-rose-600" />;
    style = 'bg-rose-100 text-rose-900 border-rose-300 font-black animate-pulse';
  } else if (normalized.includes('near') || normalized.includes('limit') || normalized.includes('at risk')) {
    icon = <AlertTriangle size={12} className="text-amber-600" />;
    style = 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${style} ${className}`}
    >
      {icon}
      {status}
    </span>
  );
}
