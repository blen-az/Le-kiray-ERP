'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { LeaveStatusBadge } from '@/components/hr/LeaveStatusBadge';
import { PermissionGate } from '@/components/auth/RequirePermission';
import { apiFetch } from '@/lib/api';

interface LeaveDetail {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason?: string;
  rejectionReason?: string;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    employeeCode?: string;
    phone?: string;
  };
  approvedBy?: { firstName: string; lastName: string };
  approvedAt?: string;
}

export default function LeaveRequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [leave, setLeave] = useState<LeaveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadLeave() {
      if (useMockData) {
        setLeave({
          id,
          leaveType: 'Annual Leave',
          startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
          totalDays: 7,
          status: 'Pending',
          reason: 'Family vacation and annual holiday leave.',
          createdAt: new Date().toISOString(),
          employee: {
            id: 'e-1',
            firstName: 'Abebe',
            lastName: 'Kebede',
            position: 'Machine Operator',
            employeeCode: 'EMP-001',
            phone: '+251911223344',
          },
        });
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/hr/leave-requests/${id}`);
        if (!res.ok) throw new Error('Leave request record not found');
        const data = await res.json();
        setLeave(data);
      } catch (err: any) {
        setError(err.message || 'Error loading leave details');
      } finally {
        setLoading(false);
      }
    }

    loadLeave();
  }, [id, apiUrl, useMockData]);

  const handleApprove = async () => {
    setActionLoading(true);
    setError(null);

    if (useMockData) {
      alert('Demo Mode: Leave request approved!');
      setLeave((prev) => (prev ? { ...prev, status: 'Approved' } : null));
      setActionLoading(false);
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/hr/leave-requests/${id}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to approve leave request');
      }

      const updated = await res.json();
      setLeave(updated);
    } catch (err: any) {
      setError(err.message || 'Error approving leave request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    if (useMockData) {
      alert('Demo Mode: Leave request rejected!');
      setLeave((prev) => (prev ? { ...prev, status: 'Rejected', rejectionReason } : null));
      setShowRejectModal(false);
      setActionLoading(false);
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/hr/leave-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to reject leave request');
      }

      const updated = await res.json();
      setLeave(updated);
      setShowRejectModal(false);
    } catch (err: any) {
      setError(err.message || 'Error rejecting leave request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading leave application..." />;

  if (error || !leave) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Leave Request Not Found'}</div>
        <Link href="/dashboard/hr/leave" className="text-xs text-[#0284c7] underline font-semibold">
          Return to Leave Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/hr/leave" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{leave.leaveType}</h2>
              <LeaveStatusBadge status={leave.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Applicant: {leave.employee?.firstName} {leave.employee?.lastName} ({leave.employee?.position})
            </p>
          </div>
        </div>

        {leave.status === 'Pending' && (
          <PermissionGate anyOf={['leave:approve', 'leave:reject']}>
            <div className="flex items-center gap-2">
              <PermissionGate permission="leave:reject">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <XCircle size={15} />
                  Reject Request
                </button>
              </PermissionGate>
              <PermissionGate permission="leave:approve">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  Approve Leave
                </button>
              </PermissionGate>
            </div>
          </PermissionGate>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Details Card */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Application Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Start Date</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">{new Date(leave.startDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">End Date</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">{new Date(leave.endDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Duration</span>
              <span className="font-black text-[#0284c7] text-sm mt-0.5 block">{leave.totalDays} Days</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Application Date</span>
              <span className="font-medium text-slate-600 mt-0.5 block">{new Date(leave.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Application Purpose / Reason</span>
            <p className="mt-1 text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
              {leave.reason || 'No specific details provided.'}
            </p>
          </div>

          {leave.status === 'Rejected' && leave.rejectionReason && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-rose-600 uppercase block">Rejection Rationale</span>
              <p className="mt-1 text-rose-900 font-semibold bg-rose-50 p-3 rounded-md border border-rose-100">
                {leave.rejectionReason}
              </p>
            </div>
          )}

          {leave.approvedBy && (
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
              <span>Decision Logged By: <strong className="text-slate-800">{leave.approvedBy.firstName} {leave.approvedBy.lastName}</strong></span>
              {leave.approvedAt && <span>Timestamp: {new Date(leave.approvedAt).toLocaleString()}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal Dialog */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-100 animate-scaleUp">
            <h3 className="text-sm font-bold text-slate-900">Reject Leave Application</h3>
            <p className="text-xs text-slate-500">Please state the reason for rejecting this leave request for employee audit records.</p>
            
            <form onSubmit={handleReject} className="space-y-4 text-xs">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Critical project deadline requires operator site presence..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-rose-500 text-slate-900"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
