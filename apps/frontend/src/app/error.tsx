'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors
    console.error('Unhandled client error captured by Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Something went wrong</h1>
        <p className="text-slate-400 text-sm mb-6">
          An unexpected error occurred while loading this view. The system administrator has been notified.
        </p>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-6 p-3 bg-slate-950 border border-slate-800 rounded-lg text-left text-xs text-red-400 font-mono overflow-auto max-h-32">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
