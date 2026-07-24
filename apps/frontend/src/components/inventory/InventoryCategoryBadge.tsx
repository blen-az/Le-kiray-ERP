import React from 'react';

interface Props {
  category: string;
  className?: string;
}

export function InventoryCategoryBadge({ category, className = '' }: Props) {
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  const cat = category?.toLowerCase() || '';

  if (cat.includes('cement')) {
    styles = 'bg-zinc-100 text-zinc-800 border-zinc-300';
  } else if (cat.includes('rebar')) {
    styles = 'bg-stone-100 text-stone-800 border-stone-300';
  } else if (cat.includes('diesel') || cat.includes('fuel')) {
    styles = 'bg-amber-100 text-amber-900 border-amber-300';
  } else if (cat.includes('safety') || cat.includes('ppe')) {
    styles = 'bg-orange-50 text-orange-800 border-orange-200';
  } else if (cat.includes('spare') || cat.includes('tool')) {
    styles = 'bg-sky-50 text-sky-800 border-sky-200';
  } else if (cat.includes('electric') || cat.includes('plumb')) {
    styles = 'bg-cyan-50 text-cyan-800 border-cyan-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${styles} ${className}`}>
      {category}
    </span>
  );
}
