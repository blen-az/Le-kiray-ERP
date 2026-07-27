'use client';

import React from 'react';
import { ShieldOff, Lock } from 'lucide-react';

interface AccessDeniedProps {
  permission?: string;
  message?: string;
  compact?: boolean;
}

export default function AccessDenied({ permission, message, compact = false }: AccessDeniedProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
        <Lock size={16} className="flex-shrink-0" />
        <p className="text-xs font-semibold">
          {message ?? 'You do not have permission to perform this action.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      {/* Icon */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-100 mb-6">
        <ShieldOff size={36} className="text-rose-400" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>

      {/* Description */}
      <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-1">
        {message ?? "You don't have permission to view this page."}
      </p>
      <p className="text-sm text-slate-400 max-w-md leading-relaxed">
        Please contact your company administrator if you believe this is a mistake.
      </p>

      {/* Permission hint */}
      {permission && (
        <div className="mt-6 px-3 py-1.5 bg-slate-100 rounded-md text-xs font-mono text-slate-500 border border-slate-200">
          Required: <span className="text-rose-500 font-bold">{permission}</span>
        </div>
      )}
    </div>
  );
}
