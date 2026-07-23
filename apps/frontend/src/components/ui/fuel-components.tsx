import React from 'react';
import Link from 'next/link';
import { Eye, Edit3, CheckCircle2, XCircle, FileSpreadsheet, EyeOff, MapPin, User, Calendar, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/utils';

// 1. Fuel Request Status Badge
export function FuelStatusBadge({ status, className }: { status: string; className?: string }) {
  const getColors = (val: string) => {
    const clean = val.trim().toLowerCase();
    switch (clean) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'issued':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partially issued':
      case 'partially_issued':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'cancelled':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize tracking-wide',
        getColors(status),
        className
      )}
    >
      {status}
    </span>
  );
}

// 2. Fuel Priority Badge
export function FuelPriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const getColors = (val: string) => {
    const clean = val.trim().toLowerCase();
    switch (clean) {
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'normal':
        return 'bg-sky-50 text-[#0284c7] border-sky-100';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold border uppercase tracking-wider',
        getColors(priority),
        className
      )}
    >
      {priority}
    </span>
  );
}

// 3. Fuel Requests Table Component
export function FuelRequestTable({ 
  requests, 
  onApprove, 
  onReject, 
  onIssue 
}: { 
  requests: any[]; 
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onIssue?: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-700 border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <th className="py-3 px-4">Request Details</th>
            <th className="py-3 px-4">Equipment</th>
            <th className="py-3 px-4">Operator</th>
            <th className="py-3 px-4">Liters (Req / App / Iss)</th>
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3.5 px-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-900 block flex items-center gap-1">
                    <MapPin size={12} className="text-[#0284c7] shrink-0" />
                    {r.site?.siteName || 'Project compound'}
                  </span>
                  <span className="text-[10px] text-slate-400 block ml-4">{r.project?.projectName}</span>
                </div>
              </td>
              <td className="py-3.5 px-4">
                {r.machine ? (
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Truck size={13} className="text-slate-400" />
                    {r.machine.brand} {r.machine.model}
                    <span className="text-[9px] font-medium text-slate-400 font-mono">({r.machine.plateNumber})</span>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No Machine</span>
                )}
              </td>
              <td className="py-3.5 px-4">
                {r.operator ? (
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <User size={12} className="text-slate-400" />
                    {r.operator.firstName} {r.operator.lastName}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Unassigned</span>
                )}
              </td>
              <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                {r.litersRequested} / {r.litersApproved || 0} / {r.litersIssued || 0}
              </td>
              <td className="py-3.5 px-4">
                <FuelPriorityBadge priority={r.priority} />
              </td>
              <td className="py-3.5 px-4">
                <FuelStatusBadge status={r.status} />
              </td>
              <td className="py-3.5 px-4 text-slate-500 font-medium">
                {formatDate(r.requestDate || r.createdAt)}
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/dashboard/fuel/requests/${r.id}`}
                    title="View Request Details"
                    className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded transition-colors"
                  >
                    <Eye size={14} />
                  </Link>

                  {r.status === 'Pending' && (
                    <>
                      {onApprove && (
                        <button
                          onClick={() => onApprove(r.id)}
                          title="Approve Request"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      {onReject && (
                        <button
                          onClick={() => onReject(r.id)}
                          title="Reject Request"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </>
                  )}

                  {(r.status === 'Approved' || r.status === 'Partially Issued') && onIssue && (
                    <button
                      onClick={() => onIssue(r.id)}
                      title="Issue Diesel Fuel"
                      className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded transition-colors"
                    >
                      <FileSpreadsheet size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 4. Fuel Logs Table Component
export function FuelLogTable({ logs }: { logs: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-700 border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <th className="py-3 px-4">Usage Date</th>
            <th className="py-3 px-4">Equipment</th>
            <th className="py-3 px-4">Operator</th>
            <th className="py-3 px-4">Location</th>
            <th className="py-3 px-4 text-right">Liters Used</th>
            <th className="py-3 px-4 text-right">Rate (ETB)</th>
            <th className="py-3 px-4 text-right">Total Cost</th>
            <th className="py-3 px-4 text-right">Hours Logged</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3.5 px-4 font-semibold text-slate-800">
                {formatDate(log.usageDate || log.createdAt)}
              </td>
              <td className="py-3.5 px-4">
                {log.machine ? (
                  <div className="font-medium text-slate-900 flex items-center gap-1">
                    <Truck size={13} className="text-slate-400 shrink-0" />
                    {log.machine.brand} {log.machine.model}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No Machine</span>
                )}
              </td>
              <td className="py-3.5 px-4">
                {log.operator ? (
                  <span className="font-medium text-slate-700">
                    {log.operator.firstName} {log.operator.lastName}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Unassigned</span>
                )}
              </td>
              <td className="py-3.5 px-4">
                <div className="text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700">{log.site?.siteName}</span>
                  <span className="block text-[9px] text-slate-400">{log.project?.projectName}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                {log.litersUsed} L
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                {formatCurrency(log.costPerLiter)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-950">
                {formatCurrency(log.totalCost)}
              </td>
              <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                {log.workingHours ? `${log.workingHours} hrs` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
