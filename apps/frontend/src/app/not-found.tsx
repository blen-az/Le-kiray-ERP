import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-amber-500" />
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 uppercase tracking-wider mb-4 inline-block">
          Error 404
        </span>

        <h1 className="text-2xl font-bold text-slate-100 mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-6">
          The ERP route or resource you are looking for does not exist, has been moved, or is restricted to higher administrative roles.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl transition-colors text-sm w-full"
        >
          <Home className="w-4 h-4" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
