'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Droplet, MapPin, Truck, User, Calendar,
  CheckCircle2, XCircle, FileSpreadsheet, Clock, Edit3,
  AlertCircle, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FuelStatusBadge, FuelPriorityBadge, FuelLogTable } from '@/components/ui/fuel-components';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PermissionGate } from '@/components/auth/RequirePermission';

export default function FuelRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  // Modal states
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'issue' | null>(null);
  const [litersApproved, setLitersApproved] = useState(0);
  const [costPerLiter, setCostPerLiter] = useState(110.50);
  const [rejectionReason, setRejectionReason] = useState('');
  const [litersIssued, setLitersIssued] = useState(0);
  const [workingHours, setWorkingHours] = useState(8);
  const [reading, setReading] = useState(0);
  const [modalNotes, setModalNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const loadData = async () => {
    if (useMockData) {
      setRequest({
        id,
        project: { id: 'p-1', projectName: 'Bole Road Expansion' },
        site: { id: 's-1', siteName: 'Olympia Junction Site' },
        machine: { id: 'm-1', brand: 'CAT', model: '320D', plateNumber: 'ET-3-A1234', machineType: 'Excavator' },
        operator: { id: 'emp-1', firstName: 'Abebe', lastName: 'Kebede', role: 'OPERATOR' },
        requestedBy: { id: 'u-1', firstName: 'Daniel', lastName: 'Solomon', email: 'daniel@abc-construction.et' },
        approvedBy: { id: 'u-2', firstName: 'Kidus', lastName: 'Getachew' },
        issuedBy: null,
        litersRequested: 200,
        litersApproved: 200,
        litersIssued: 0,
        costPerLiter: 110.50,
        totalCost: 22100.00,
        status: 'Approved',
        priority: 'High',
        purpose: 'Bole Road grading phase 2 – excavation at chainage 1+200',
        notes: 'High priority – compaction cannot proceed until fuel is issued.',
        requestDate: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        issuedAt: null,
        rejectionReason: null,
        fuelLogs: [],
      });
      setUsingMock(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/fuel/requests/${id}`);
      if (!res.ok) throw new Error('Could not load fuel request details');
      setRequest(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id, useMockData, apiUrl]);

  const openApprove = () => {
    setLitersApproved(request?.litersRequested || 0);
    setCostPerLiter(110.50);
    setModalNotes('');
    setActionError(null);
    setModalType('approve');
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setActionError(null);
    if (usingMock) {
      setRequest({ ...request, status: 'Approved', litersApproved, costPerLiter });
      setModalType(null);
      setActionLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/fuel/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ litersApproved, costPerLiter, notes: modalNotes }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Approval failed');
      }
      setModalType(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { setActionError('Rejection reason is required'); return; }
    setActionLoading(true);
    setActionError(null);
    if (usingMock) {
      setRequest({ ...request, status: 'Rejected', rejectionReason });
      setModalType(null);
      setActionLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/fuel/requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!res.ok) throw new Error('Rejection failed');
      setModalType(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!litersIssued || litersIssued <= 0) { setActionError('Liters issued must be greater than 0'); return; }
    setActionLoading(true);
    setActionError(null);
    if (usingMock) {
      setRequest({ ...request, status: 'Issued', litersIssued });
      setModalType(null);
      setActionLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/fuel/requests/${id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          litersIssued,
          usageDate: new Date().toISOString().split('T')[0],
          workingHours,
          odometerOrHourMeterReading: reading || undefined,
          notes: modalNotes || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Issuance failed');
      }
      setModalType(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading fuel request details..." />;
  if (error || !request) return <ErrorState message={error || 'Fuel request not found'} />;

  const canApprove = request.status === 'Pending';
  const canReject = request.status === 'Pending';
  const canIssue = request.status === 'Approved' || request.status === 'Partially Issued';

  return (
    <div className="space-y-6">
      {/* Action Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full border border-slate-100 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                {modalType === 'approve' && <><CheckCircle2 size={16} className="text-emerald-600" /> Approve Request</>}
                {modalType === 'reject' && <><XCircle size={16} className="text-rose-600" /> Reject Request</>}
                {modalType === 'issue' && <><FileSpreadsheet size={16} className="text-[#0284c7]" /> Issue Fuel</>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex gap-1.5 items-start">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />{actionError}
                </div>
              )}

              {modalType === 'approve' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">Liters Approved *</label>
                      <input type="number" value={litersApproved} onChange={e => setLitersApproved(+e.target.value)}
                        className="w-full py-1.5 px-3 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">Cost/Liter (ETB) *</label>
                      <input type="number" value={costPerLiter} onChange={e => setCostPerLiter(+e.target.value)}
                        className="w-full py-1.5 px-3 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]" />
                    </div>
                  </div>
                  <div className="text-xs p-2 bg-sky-50 border border-sky-100 rounded text-sky-700 font-semibold">
                    Est. Total Cost: {formatCurrency(litersApproved * costPerLiter)}
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-700">Notes</label>
                    <textarea rows={2} value={modalNotes} onChange={e => setModalNotes(e.target.value)}
                      className="w-full py-1.5 px-3 border border-slate-200 rounded-md text-slate-700 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-[#0284c7]" />
                  </div>
                </>
              )}

              {modalType === 'reject' && (
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-700">Rejection Reason *</label>
                  <textarea rows={3} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Explain why this request is being rejected..."
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-md text-slate-700 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-rose-400" />
                </div>
              )}

              {modalType === 'issue' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">Liters to Issue *</label>
                      <input type="number" value={litersIssued} onChange={e => setLitersIssued(+e.target.value)}
                        max={request.litersApproved - request.litersIssued}
                        className="w-full py-1.5 px-3 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]" />
                      <p className="text-[10px] text-slate-400">Max: {request.litersApproved - request.litersIssued} L remaining</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">Hour Meter Reading</label>
                      <input type="number" value={reading} onChange={e => setReading(+e.target.value)}
                        className="w-full py-1.5 px-3 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]" />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-700">Working Hours Logged</label>
                    <input type="number" value={workingHours} onChange={e => setWorkingHours(+e.target.value)}
                      className="w-full py-1.5 px-3 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-700">Notes</label>
                    <textarea rows={2} value={modalNotes} onChange={e => setModalNotes(e.target.value)}
                      className="w-full py-1.5 px-3 border border-slate-200 rounded-md text-slate-700 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-[#0284c7]" />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                <button onClick={() => { setModalType(null); setActionError(null); }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-md hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  onClick={modalType === 'approve' ? handleApprove : modalType === 'reject' ? handleReject : handleIssue}
                  disabled={actionLoading}
                  className={`px-4 py-1.5 text-white text-xs font-semibold rounded-md disabled:opacity-60 ${
                    modalType === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : modalType === 'approve' ? 'Approve' : modalType === 'reject' ? 'Reject' : 'Issue Fuel'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nav */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/fuel" className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <span className="text-xs text-slate-500 font-medium">Fuel Requests</span>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-xs font-semibold text-slate-700">Request Details</span>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <PermissionGate permission="fuel:approve">
              <button onClick={openApprove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors">
                <CheckCircle2 size={13} /> Approve
              </button>
            </PermissionGate>
          )}
          {canReject && (
            <PermissionGate permission="fuel:reject">
              <button onClick={() => { setRejectionReason(''); setActionError(null); setModalType('reject'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md transition-colors">
                <XCircle size={13} /> Reject
              </button>
            </PermissionGate>
          )}
          {canIssue && (
            <PermissionGate permission="fuel:issue">
              <button onClick={() => { setLitersIssued(request.litersApproved - request.litersIssued); setWorkingHours(8); setReading(0); setModalNotes(''); setActionError(null); setModalType('issue'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white text-xs font-semibold rounded-md transition-colors">
                <FileSpreadsheet size={13} /> Issue Fuel
              </button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <Card className="border border-slate-100 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <Droplet size={24} />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Fuel Request</h2>
                  <FuelStatusBadge status={request.status} className="bg-white/10 text-white border-white/20" />
                  <FuelPriorityBadge priority={request.priority} className="bg-white/10 text-white border-white/20" />
                </div>
                <p className="text-white/60 text-xs font-medium">
                  {request.site?.siteName} · {request.project?.projectName}
                </p>
                <p className="text-white/40 text-[10px] font-mono">{request.id}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-white/60 text-[10px] font-bold uppercase">Requested Volume</div>
              <div className="text-2xl font-extrabold text-white">{request.litersRequested} L</div>
              {request.totalCost && (
                <div className="text-white/60 text-xs font-semibold">{formatCurrency(request.totalCost)} est. cost</div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 bg-slate-800 border-t border-white/5">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1.5">
            <span>Issued: {request.litersIssued} L</span>
            <span>Approved: {request.litersApproved} L</span>
            <span>Requested: {request.litersRequested} L</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all"
              style={{ width: `${request.litersApproved > 0 ? (request.litersIssued / request.litersApproved) * 100 : 0}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Core Info */}
        <div className="md:col-span-2 space-y-5">
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Machine</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Truck size={12} className="text-slate-400" />
                  {request.machine?.brand} {request.machine?.model}
                </span>
                <span className="text-[10px] text-slate-400 font-mono ml-4">{request.machine?.plateNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Operator</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <User size={12} className="text-slate-400" />
                  {request.operator ? `${request.operator.firstName} ${request.operator.lastName}` : 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Request Date</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar size={12} className="text-slate-400" />
                  {formatDate(request.requestDate || request.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Requested By</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {request.requestedBy ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Purpose</span>
                <span className="font-medium text-slate-700 mt-0.5 block">{request.purpose || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Notes</span>
                <span className="font-medium text-slate-700 mt-0.5 block">{request.notes || '—'}</span>
              </div>
              {request.rejectionReason && (
                <div className="col-span-2">
                  <span className="text-rose-500 font-bold block text-[10px] uppercase">Rejection Reason</span>
                  <span className="font-medium text-rose-700 mt-0.5 block">{request.rejectionReason}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fuel Logs */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Issuance Records ({request.fuelLogs?.length || 0})
              </CardTitle>
              <CardDescription>All diesel dispenses linked to this request.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {request.fuelLogs?.length > 0 ? (
                <FuelLogTable logs={request.fuelLogs} />
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  No issuances recorded yet for this request.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Status Timeline */}
        <div className="space-y-5">
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">Approval Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="relative border-l border-slate-200 pl-5 ml-1 space-y-5">
                {/* Submitted */}
                <div className="relative">
                  <span className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-[#0284c7] border-2 border-white shadow-sm" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Request Submitted</span>
                    <span className="text-[10px] text-slate-400">{formatDate(request.requestDate || request.createdAt)}</span>
                    <span className="text-slate-500 block mt-0.5">By {request.requestedBy?.firstName} {request.requestedBy?.lastName}</span>
                  </div>
                </div>

                {/* Approved / Rejected */}
                {request.approvedAt && (
                  <div className="relative">
                    <span className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                      request.status === 'Rejected' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`} />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">{request.status === 'Rejected' ? 'Request Rejected' : 'Request Approved'}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(request.approvedAt)}</span>
                      {request.approvedBy && (
                        <span className="text-slate-500 block mt-0.5">By {request.approvedBy.firstName} {request.approvedBy.lastName}</span>
                      )}
                      {request.litersApproved > 0 && (
                        <span className="text-sky-700 font-semibold block mt-0.5">{request.litersApproved} L @ {formatCurrency(request.costPerLiter || 0)}/L</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Issued */}
                {request.issuedAt && (
                  <div className="relative">
                    <span className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">Fuel Issued</span>
                      <span className="text-[10px] text-slate-400">{formatDate(request.issuedAt)}</span>
                      <span className="text-indigo-700 font-semibold block mt-0.5">{request.litersIssued} L dispatched</span>
                    </div>
                  </div>
                )}

                {/* Pending next step indicator */}
                {(request.status === 'Pending' || request.status === 'Approved') && (
                  <div className="relative">
                    <span className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm animate-pulse" />
                    <div className="text-xs">
                      <span className="font-bold text-amber-700 block">
                        {request.status === 'Pending' ? 'Awaiting Approval' : 'Awaiting Issuance'}
                      </span>
                      <span className="text-[10px] text-slate-400">Action required</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Requested Volume</span>
                <span className="font-semibold text-slate-900">{request.litersRequested} L</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Approved Volume</span>
                <span className="font-semibold text-slate-900">{request.litersApproved} L</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Issued Volume</span>
                <span className="font-semibold text-slate-900">{request.litersIssued} L</span>
              </div>
              {request.costPerLiter && (
                <>
                  <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-3">
                    <span>Rate / Liter</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(request.costPerLiter)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold">
                    <span>Total Fuel Cost</span>
                    <span>{formatCurrency(request.totalCost || 0)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
