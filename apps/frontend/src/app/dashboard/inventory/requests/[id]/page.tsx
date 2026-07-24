'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, PackageCheck, AlertCircle, Building2, User, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { InventoryRequestStatusBadge } from '@/components/inventory/InventoryRequestStatusBadge';
import { InventoryPriorityBadge } from '@/components/inventory/InventoryPriorityBadge';

interface MaterialRequestDetail {
  id: string;
  quantityRequested: number;
  quantityApproved: number;
  quantityIssued: number;
  status: string;
  priority: string;
  requestDate: string;
  approvedAt?: string;
  issuedAt?: string;
  purpose?: string;
  notes?: string;
  rejectionReason?: string;
  project?: { id: string; projectName: string };
  site?: { id: string; siteName: string };
  inventoryItem?: {
    id: string;
    itemName: string;
    unit: string;
    currentQuantity: number;
    defaultWarehouse?: { id: string; warehouseName: string };
  };
  requestedBy?: { firstName: string; lastName: string };
  approvedBy?: { firstName: string; lastName: string };
  issuedBy?: { firstName: string; lastName: string };
}

interface Warehouse {
  id: string;
  warehouseName: string;
}

export default function InventoryRequestDetailPage() {
  const params = useParams();
  const reqId = params.id as string;
  const router = useRouter();

  const [request, setRequest] = useState<MaterialRequestDetail | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Form inputs for modals
  const [approveQty, setApproveQty] = useState('');
  const [approveNotes, setApproveNotes] = useState('');

  const [rejectionReason, setRejectionReason] = useState('');

  const [issueQty, setIssueQty] = useState('');
  const [issueSourceWh, setIssueSourceWh] = useState('');
  const [issueNotes, setIssueNotes] = useState('');

  const [submittingAction, setSubmittingAction] = useState(false);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadData() {
      if (useMockData) {
        setRequest({
          id: reqId,
          quantityRequested: 300,
          quantityApproved: 300,
          quantityIssued: 200,
          status: 'Partially Issued',
          priority: 'High',
          requestDate: new Date(Date.now() - 86400000 * 3).toISOString(),
          approvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          issuedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          purpose: 'Block work and plastering for Block B',
          notes: 'Dispatched from Main Warehouse.',
          project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
          site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
          inventoryItem: {
            id: 'i-1',
            itemName: 'Cement 50kg',
            unit: 'Bag',
            currentQuantity: 1200,
            defaultWarehouse: { id: 'wh-1', warehouseName: 'Main Warehouse - Addis Ababa' },
          },
          requestedBy: { firstName: 'Tariku', lastName: 'Mengistu' },
          approvedBy: { firstName: 'Inventory', lastName: 'Manager' },
          issuedBy: { firstName: 'Inventory', lastName: 'Manager' },
        });
        setWarehouses([
          { id: 'wh-1', warehouseName: 'Main Warehouse - Addis Ababa' },
          { id: 'wh-2', warehouseName: 'Bole Site Store' },
        ]);
        setLoading(false);
        return;
      }

      try {
        const [reqRes, whRes] = await Promise.all([
          fetch(`${apiUrl}/inventory/requests/${reqId}`),
          fetch(`${apiUrl}/inventory/warehouses`),
        ]);

        if (whRes.ok) setWarehouses(await whRes.json());

        if (!reqRes.ok) throw new Error('Material request not found');
        const data = await reqRes.json();
        setRequest(data);
        setApproveQty(data.quantityRequested?.toString() || '');
        setIssueQty((data.quantityApproved - data.quantityIssued)?.toString() || '');
        if (data.inventoryItem?.defaultWarehouse) {
          setIssueSourceWh(data.inventoryItem.defaultWarehouse.id);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading request details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [reqId, apiUrl, useMockData]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);

    const qty = parseFloat(approveQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Approved quantity must be > 0');
      setSubmittingAction(false);
      return;
    }

    if (useMockData) {
      setRequest({
        ...request!,
        status: 'Approved',
        quantityApproved: qty,
        approvedAt: new Date().toISOString(),
      });
      setShowApproveModal(false);
      setSubmittingAction(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/inventory/requests/${reqId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityApproved: qty,
          notes: approveNotes || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Approval failed');
      }
      const updated = await res.json();
      setRequest(updated);
      setShowApproveModal(false);
    } catch (err: any) {
      alert(err.message || 'Error approving request');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);

    if (!rejectionReason) {
      alert('Rejection reason is required');
      setSubmittingAction(false);
      return;
    }

    if (useMockData) {
      setRequest({
        ...request!,
        status: 'Rejected',
        rejectionReason,
      });
      setShowRejectModal(false);
      setSubmittingAction(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/inventory/requests/${reqId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Rejection failed');
      }
      const updated = await res.json();
      setRequest(updated);
      setShowRejectModal(false);
    } catch (err: any) {
      alert(err.message || 'Error rejecting request');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);

    const qty = parseFloat(issueQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Issued quantity must be > 0');
      setSubmittingAction(false);
      return;
    }

    if (useMockData) {
      const newIssued = (request!.quantityIssued || 0) + qty;
      const newStatus = newIssued >= request!.quantityApproved ? 'Issued' : 'Partially Issued';
      setRequest({
        ...request!,
        quantityIssued: newIssued,
        status: newStatus,
        issuedAt: new Date().toISOString(),
      });
      setShowIssueModal(false);
      setSubmittingAction(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/inventory/requests/${reqId}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityIssued: qty,
          sourceWarehouseId: issueSourceWh || undefined,
          notes: issueNotes || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Issuance failed');
      }
      const updated = await res.json();
      setRequest(updated);
      setShowIssueModal(false);
    } catch (err: any) {
      alert(err.message || 'Error issuing request');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) return <LoadingState message="Fetching material request workflow details..." />;

  if (error || !request) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Request Not Found'}</div>
        <Link href="/dashboard/inventory/requests" className="text-xs text-[#0284c7] underline font-semibold">
          Return to Material Requests
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory/requests" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Material Requisition Details</h2>
              <InventoryRequestStatusBadge status={request.status} />
              <InventoryPriorityBadge priority={request.priority} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Request ID: #{request.id.slice(0, 8)} • Date: {new Date(request.requestDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Workflow Actions */}
        <div className="flex flex-wrap gap-2">
          {request.status === 'Pending' && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
              >
                <XCircle size={14} />
                Reject
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="flex items-center gap-1 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
              >
                <CheckCircle2 size={14} />
                Approve
              </button>
            </>
          )}

          {(request.status === 'Approved' || request.status === 'Partially Issued') && (
            <button
              onClick={() => setShowIssueModal(true)}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-xs"
            >
              <PackageCheck size={16} />
              Dispatch / Issue Material
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Quantity Requested</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {request.quantityRequested} <span className="text-xs font-medium text-slate-500">{request.inventoryItem?.unit}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Quantity Approved</span>
            <div className="text-2xl font-black text-sky-700 mt-1">
              {request.quantityApproved || 0} <span className="text-xs font-medium text-slate-500">{request.inventoryItem?.unit}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Quantity Issued</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {request.quantityIssued || 0} <span className="text-xs font-medium text-slate-500">{request.inventoryItem?.unit}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Requisition Specifications</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs text-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Material Item</span>
              <span className="font-extrabold text-slate-900 text-sm block mt-0.5">{request.inventoryItem?.itemName}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Project Contract</span>
                <span className="font-bold text-slate-800 block mt-0.5">{request.project?.projectName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Site Plot</span>
                <span className="font-bold text-slate-800 block mt-0.5">{request.site?.siteName}</span>
              </div>
            </div>
            {request.purpose && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Work Purpose / Scope</span>
                <p className="mt-0.5 text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">{request.purpose}</p>
              </div>
            )}
            {request.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900">
                <span className="font-bold block text-[10px] uppercase">Rejection Reason</span>
                <p className="mt-0.5">{request.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Workflow & Approvals Audit</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs text-slate-700">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Requested By</span>
              <span className="font-bold">{request.requestedBy ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}` : 'System'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Approved By</span>
              <span className="font-bold">{request.approvedBy ? `${request.approvedBy.firstName} ${request.approvedBy.lastName}` : 'Pending'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Issued By</span>
              <span className="font-bold">{request.issuedBy ? `${request.issuedBy.firstName} ${request.issuedBy.lastName}` : 'Not Issued'}</span>
            </div>
            {request.notes && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Notes & Remarks</span>
                <p className="mt-0.5 text-slate-600 leading-relaxed whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* APPROVE MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Approve Material Request</h3>
            <p className="text-slate-500">Set approved quantity for {request.inventoryItem?.itemName}.</p>
            <form onSubmit={handleApprove} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Quantity Approved *</label>
                <input
                  type="number"
                  required
                  min="0.0001"
                  step="any"
                  value={approveQty}
                  onChange={(e) => setApproveQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Approval Remarks</label>
                <input
                  type="text"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="e.g. Approved for phase 1 block work"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-3 py-1.5 border rounded-md font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-1.5 rounded-md font-bold"
                >
                  {submittingAction ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 text-rose-600">Reject Material Request</h3>
            <p className="text-slate-500">State clear rejection reason for contractor records.</p>
            <form onSubmit={handleReject} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Insufficient store balance or scope unverified"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 border rounded-md font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-md font-bold"
                >
                  {submittingAction ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 text-emerald-700">Dispatch / Issue Approved Material</h3>
            <p className="text-slate-500">Record quantity issued from storehouse to project site plot.</p>
            <form onSubmit={handleIssue} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Quantity Issued *</label>
                <input
                  type="number"
                  required
                  min="0.0001"
                  step="any"
                  value={issueQty}
                  onChange={(e) => setIssueQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Source Storehouse</label>
                <select
                  value={issueSourceWh}
                  onChange={(e) => setIssueSourceWh(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Default Store</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Dispatch Notes / Waybill Ref</label>
                <input
                  type="text"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="e.g. Dispatched via Truck #3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-1.5 border rounded-md font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md font-bold"
                >
                  {submittingAction ? 'Issuing...' : 'Confirm Issuance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
