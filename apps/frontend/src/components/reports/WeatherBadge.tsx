import React from 'react';
import { Sun, Cloud, CloudRain, Wind, CloudSun, AlertTriangle } from 'lucide-react';

interface WeatherBadgeProps {
  condition?: string;
  className?: string;
}

export function WeatherBadge({ condition = 'Sunny', className = '' }: WeatherBadgeProps) {
  let icon = <Sun size={12} className="text-amber-500" />;
  let style = 'bg-amber-50 text-amber-900 border-amber-200';

  const normalized = condition.toLowerCase();

  if (normalized === 'cloudy') {
    icon = <Cloud size={12} className="text-slate-500" />;
    style = 'bg-slate-100 text-slate-700 border-slate-200';
  } else if (normalized === 'rainy') {
    icon = <CloudRain size={12} className="text-sky-600" />;
    style = 'bg-sky-50 text-sky-900 border-sky-200 font-bold';
  } else if (normalized === 'windy') {
    icon = <Wind size={12} className="text-teal-600" />;
    style = 'bg-teal-50 text-teal-900 border-teal-200';
  } else if (normalized === 'partly cloudy' || normalized === 'partly_cloudy') {
    icon = <CloudSun size={12} className="text-amber-600" />;
    style = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (normalized === 'dusty') {
    icon = <AlertTriangle size={12} className="text-orange-600" />;
    style = 'bg-orange-50 text-orange-900 border-orange-200';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${style} ${className}`}
    >
      {icon}
      {condition}
    </span>
  );
}
