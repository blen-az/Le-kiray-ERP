import React from 'react';

interface ProgressBarProps {
  value: number;
  showText?: boolean;
}

export function ProgressBar({ value, showText = false }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {showText && <span className="text-[10px] font-semibold text-slate-700">Progress</span>}
        {showText && <span className="text-[10px] font-bold text-[#0284c7]">{Math.round(percentage)}%</span>}
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-sky-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
