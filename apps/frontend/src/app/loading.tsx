import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading Le’Kiray ERP...</p>
      </div>
    </div>
  );
}
