import React from 'react';

interface AttendanceStatusBadgeProps {
  status?: string;
  className?: string;
}

export function AttendanceStatusBadge({ status = 'Present', className = '' }: AttendanceStatusBadgeProps) {
  let style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  const normalized = status.toLowerCase();

  if (normalized === 'absent') {
    style = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (normalized === 'late') {
    style = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (normalized === 'on leave' || normalized === 'on_leave') {
    style = 'bg-sky-50 text-sky-800 border-sky-200';
  } else if (normalized === 'half day' || normalized === 'permission') {
    style = 'bg-purple-50 text-purple-800 border-purple-200';
  } else if (normalized === 'sick') {
    style = 'bg-orange-50 text-orange-800 border-orange-200';
  } else if (normalized === 'holiday') {
    style = 'bg-indigo-50 text-indigo-800 border-indigo-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${style} ${className}`}
    >
      {status}
    </span>
  );
}
