import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  retryAction?: () => void;
}

export function ErrorState({ title = 'Database Connection Failed', message, retryAction }: ErrorStateProps) {
  return (
    <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg max-w-2xl mx-auto my-8 shadow-xs">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-rose-600 animate-bounce" size={20} />
        <h3 className="font-bold text-sm text-rose-900">{title}</h3>
      </div>
      <p className="text-xs mt-2 leading-relaxed text-rose-700">{message}</p>
      <p className="text-xs mt-3 text-slate-500 border-t border-rose-200/50 pt-2 font-medium">
        Ensure the backend NestJS service is running and database container is active. 
        Alternatively, toggle the mock data mode key <code>NEXT_PUBLIC_USE_MOCK_DATA=true</code> in your environment file.
      </p>
      {retryAction && (
        <button
          onClick={retryAction}
          className="mt-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
