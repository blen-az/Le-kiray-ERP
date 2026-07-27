'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  MapPin,
  Truck,
  User,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ExpenseCategoryBadge } from '@/components/finance/ExpenseCategoryBadge';
import { ExpenseStatusBadge } from '@/components/finance/ExpenseStatusBadge';
import { PermissionGate } from '@/components/auth/RequirePermission';
import { formatCurrency } from '@/lib/utils';

interface ExpenseDetail {
  id: string;
  expenseDate: string;
  expenseCategory: string;
  expenseType?: string;
  amount: number;
  currency: string;
  description?: string;
  vendorName?: string;
  receiptUrl?: string;
  referenceNumber?: string;
  notes?: string;
  status: string;
  project?: { id: string; projectName: string; projectCode?: string; clientName?: string };
  site?: { id: string; siteName: string; location?: string };
  machine?: { id: string; brand: string; model: string; plateNumber?: string; machineType?: string };
  recordedBy?: { id: string; firstName: string; lastName: string; email?: string };
  approvedBy?: { id: string; firstName: string; lastName: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

export default function ExpenseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadExpense() {
      if (useMockData) {
        setExpense({
          id,
          expenseDate: new Date(Date.now() - 86400000).toISOString(),
          expenseCategory: 'Fuel',
          expenseType: 'Operational',
          amount: 45000,
          currency: 'ETB',
          description: 'Emergency diesel tank transport for Bole Road excavation shift.',
          vendorName: 'Kality Fuel Transports PLC',
          referenceNumber: 'INV-2026-0891',
          status: 'Approved',
          project: { id: 'p-1', projectName: 'Bole Road Expansion', clientName: 'AACRA' },
          site: { id: 's-1', siteName: 'Olympia Junction Site', location: 'Olympia, Addis Ababa' },
          machine: { id: 'm-1', brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234' },
          recordedBy: { id: 'u-1', firstName: 'Kidus', lastName: 'Getachew' },
          approvedBy: { id: 'u-2', firstName: 'Mekdes', lastName: 'Alemu' },
        });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/finance/expenses/${id}`);
        if (!res.ok) throw new Error('Expense record not found');
        setExpense(await res.json());
      } catch (err: any) {
        setError(err.message || 'Error loading expense details');
      } finally {
        setLoading(false);
      }
    }

    loadExpense();
  }, [id, apiUrl, useMockData]);

  const handleApprove = async () => {
    setActionLoading(true);
    if (useMockData) {
      alert('Demo Mode: Expense approved!');
      setExpense((prev) => prev ? { ...prev, status: 'Approved' } : null);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/finance/expenses/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' }),
      });
      if (!res.ok) throw new Error('Failed to approve expense');
      setExpense(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    if (useMockData) {
      alert('Demo Mode: Expense rejected!');
      setExpense((prev) => prev ? { ...prev, status: 'Rejected' } : null);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/finance/expenses/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' }),
      });
      if (!res.ok) throw new Error('Failed to reject expense');
      setExpense(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    setActionLoading(true);

    if (useMockData) {
      alert('Demo Mode: Expense deleted!');
      router.push('/dashboard/finance/expenses');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/finance/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      router.push('/dashboard/finance/expenses');
    } catch (err: any) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading expense details..." />;
  if (!expense || error) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Expense Not Found'}</div>
        <Link href="/dashboard/finance/expenses" className="text-xs text-[#0284c7] underline font-semibold">
          Return to Expenses Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/finance/expenses" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{expense.expenseCategory} Expense</h2>
              <ExpenseCategoryBadge category={expense.expenseCategory} />
              <ExpenseStatusBadge status={expense.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {expense.project?.projectName || 'General Office'} • {new Date(expense.expenseDate).toLocaleDateString()} • {expense.vendorName || 'No Vendor'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {expense.status !== 'Approved' && (
            <PermissionGate permission="finance:update">
              <Link
                href={`/dashboard/finance/expenses/${id}/edit`}
                className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold"
              >
                <Edit3 size={15} />
                Edit
              </Link>
            </PermissionGate>
          )}

          {expense.status === 'Recorded' && (
            <PermissionGate permission="finance:approve">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-md text-xs font-bold disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-md text-xs font-bold disabled:opacity-50"
                >
                  <XCircle size={15} />
                  Reject
                </button>
              </div>
            </PermissionGate>
          )}

          <PermissionGate permission="finance:delete">
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md text-xs font-bold disabled:opacity-50"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </PermissionGate>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Amount Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="col-span-2 border border-slate-900 bg-slate-900 text-white p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Expense Amount</span>
          <div className="text-3xl font-black text-white mt-1">{formatCurrency(expense.amount)}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">{expense.currency} • {expense.expenseType || 'Operational'}</span>
        </Card>

        <Card className="border border-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Expense Date</span>
          <span className="text-sm font-black text-slate-900 mt-1 block">{new Date(expense.expenseDate).toLocaleDateString()}</span>
          <span className="text-[10px] text-slate-500">{expense.expenseCategory}</span>
        </Card>

        <Card className="border border-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Reference</span>
          <span className="text-xs font-black font-mono text-slate-900 mt-1 block">{expense.referenceNumber || 'N/A'}</span>
          <span className="text-[10px] text-slate-500">{expense.vendorName || 'No Vendor'}</span>
        </Card>
      </div>

      {/* Details Card */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-xs text-slate-700">
          {expense.description && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Description / Purpose</span>
              <p className="mt-1 text-slate-900 font-semibold leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                {expense.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Project</span>
              <span className="font-bold text-slate-900 mt-1 block">{expense.project?.projectName || 'General Office'}</span>
              <span className="text-[10px] text-slate-500">{expense.project?.clientName || ''}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Site</span>
              <span className="font-bold text-slate-900 mt-1 block">{expense.site?.siteName || 'Headquarters'}</span>
              <span className="text-[10px] text-slate-500">{expense.site?.location || ''}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Heavy Machine</span>
              <span className="font-bold text-slate-900 mt-1 block">
                {expense.machine ? `${expense.machine.brand} ${expense.machine.model}` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{expense.machine?.plateNumber || ''}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Vendor</span>
              <span className="font-bold text-slate-900 mt-1 block">{expense.vendorName || 'N/A'}</span>
              <span className="text-[10px] text-slate-500 font-mono">{expense.referenceNumber || ''}</span>
            </div>
          </div>

          {expense.receiptUrl && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Receipt / Attachment</span>
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0284c7] font-semibold hover:underline text-xs flex items-center gap-1 mt-1"
              >
                <FileText size={13} />
                View Attached Receipt Document
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Recorded By</span>
              <span className="font-bold text-slate-900 mt-1 block">
                {expense.recordedBy ? `${expense.recordedBy.firstName} ${expense.recordedBy.lastName}` : 'System'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved By</span>
              <span className="font-bold text-emerald-700 mt-1 block">
                {expense.approvedBy ? `${expense.approvedBy.firstName} ${expense.approvedBy.lastName}` : 'Pending Approval'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
