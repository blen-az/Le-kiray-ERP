import React from 'react';
import {
  Droplet,
  Warehouse,
  Truck,
  Wrench,
  Users,
  Bus,
  UserCheck,
  Hammer,
  Building,
  Zap,
  FileCheck,
  HelpCircle,
  Tag,
} from 'lucide-react';

interface ExpenseCategoryBadgeProps {
  category?: string;
  className?: string;
}

export function ExpenseCategoryBadge({ category = 'Other', className = '' }: ExpenseCategoryBadgeProps) {
  let icon = <Tag size={12} className="text-slate-500" />;
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  const normalized = category.toLowerCase();

  if (normalized.includes('fuel')) {
    icon = <Droplet size={12} className="text-amber-600" />;
    style = 'bg-amber-50 text-amber-900 border-amber-200 font-medium';
  } else if (normalized.includes('inventory') || normalized.includes('material')) {
    icon = <Warehouse size={12} className="text-sky-600" />;
    style = 'bg-sky-50 text-sky-900 border-sky-200 font-medium';
  } else if (normalized.includes('machinery') || normalized.includes('rental')) {
    icon = <Truck size={12} className="text-indigo-600" />;
    style = 'bg-indigo-50 text-indigo-900 border-indigo-200 font-medium';
  } else if (normalized.includes('maintenance')) {
    icon = <Wrench size={12} className="text-rose-600" />;
    style = 'bg-rose-50 text-rose-800 border-rose-200 font-medium';
  } else if (normalized.includes('labor')) {
    icon = <Users size={12} className="text-emerald-600" />;
    style = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';
  } else if (normalized.includes('transport')) {
    icon = <Bus size={12} className="text-purple-600" />;
    style = 'bg-purple-50 text-purple-900 border-purple-200';
  } else if (normalized.includes('subcontractor')) {
    icon = <UserCheck size={12} className="text-teal-600" />;
    style = 'bg-teal-50 text-teal-900 border-teal-200 font-semibold';
  } else if (normalized.includes('tool') || normalized.includes('equipment')) {
    icon = <Hammer size={12} className="text-amber-700" />;
    style = 'bg-amber-100/60 text-amber-900 border-amber-300';
  } else if (normalized.includes('site office') || normalized.includes('office')) {
    icon = <Building size={12} className="text-slate-600" />;
    style = 'bg-slate-100 text-slate-800 border-slate-200';
  } else if (normalized.includes('utilit')) {
    icon = <Zap size={12} className="text-amber-500" />;
    style = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (normalized.includes('permit') || normalized.includes('fee')) {
    icon = <FileCheck size={12} className="text-blue-600" />;
    style = 'bg-blue-50 text-blue-900 border-blue-200';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${style} ${className}`}
    >
      {icon}
      {category}
    </span>
  );
}
