'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  ArrowLeft,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ExpenseCategoryBadge } from '@/components/finance/ExpenseCategoryBadge';
import { ExpenseStatusBadge } from '@/components/finance/ExpenseStatusBadge';
import { formatCurrency } from '@/lib/utils';

interface ExpenseItem {
  id: string;
  expenseDate: string;
  expenseCategory: string;
  expenseType?: string;
  amount: number;
  currency: string;
  vendorName?: string;
  referenceNumber?: string;
  description?: string;
  status: string;
  project?: { id: string; projectName: string; projectCode?: string };
  site?: { id: string; siteName: string };
  machine?: { id: string; brand: string; model: string; plateNumber?: string };
  recordedBy?: { id: string; firstName: string; lastName: string };
}

const fallbackExpenses: ExpenseItem[] = [
  {
    id: 'exp-1',
    expenseDate: new Date(Date.now() - 86400000).toISOString(),
    expenseCategory: 'Fuel',
    expenseType: 'Operational',
    amount: 45000,
    currency: 'ETB',
    vendorName: 'Kality Fuel Transports PLC',
    referenceNumber: 'INV-2026-0891',
    description: 'Emergency diesel tank transport for Bole Road excavation shift.',
    status: 'Approved',
    project: { id: 'p-1', projectName: 'Bole Road Expansion' },
    site: { id: 's-1', siteName: 'Olympia Junction Site' },
    machine: { id: 'm-1', brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234' },
    recordedBy: { id: 'u-1', firstName: 'Kidus', lastName: 'Getachew' },
  },
  {
    id: 'exp-2',
    expenseDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    expenseCategory: 'Subcontractor',
    expenseType: 'Direct Labor',
    amount: 120000,
    currency: 'ETB',
    vendorName: 'Hawassa Masonry Union Subcontractors',
    referenceNumber: 'SUB-HW-042',
    description: 'Subcontractor masonry labor support for Block B foundation pouring.',
    status: 'Approved',
    project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
    site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
    recordedBy: { id: 'u-2', firstName: 'Mekdes', lastName: 'Alemu' },
  },
  {
    id: 'exp-3',
    expenseDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    expenseCategory: 'Utilities',
    expenseType: 'Overhead',
    amount: 18500,
    currency: 'ETB',
    vendorName: 'Ethiopian Electric Utility',
    referenceNumber: 'EEU-DD-9921',
    description: 'High-voltage temporary site connection utility bill.',
    status: 'Recorded',
    project: { id: 'p-3', projectName: 'Dire Dawa Water Pipeline' },
    recordedBy: { id: 'u-1', firstName: 'Kidus', lastName: 'Getachew' },
  },
];

export default function ExpensesDirectoryPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(fallbackExpenses);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadExpenses() {
      if (useMockData) {
        setExpenses(fallbackExpenses);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/finance/expenses`);
        if (res.ok) setExpenses(await res.json());
      } catch (err) {
        console.error('Error loading expenses:', err);
        setExpenses(fallbackExpenses);
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, [apiUrl, useMockData]);

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
      (e.vendorName && e.vendorName.toLowerCase().includes(search.toLowerCase())) ||
      (e.referenceNumber && e.referenceNumber.toLowerCase().includes(search.toLowerCase())) ||
      (e.project?.projectName && e.project.projectName.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || e.expenseCategory === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalFilteredAmount = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <LoadingState message="Fetching manual operational expenses..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/finance" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Manual Expenses Directory</h2>
            <p className="text-xs text-slate-500">Record and approve project site expenses, subcontractor invoices, permits, and utilities.</p>
          </div>
        </div>

        <Link
          href="/dashboard/finance/expenses/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          Record New Expense
        </Link>
      </div>

      {/* Directory Table Card */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Expense Logs</CardTitle>
            <CardDescription className="text-xs text-slate-500">Showing {filtered.length} entries matching filters.</CardDescription>
          </div>
          <div className="text-xs font-bold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
            Total Filtered Amount: <span className="text-emerald-700">{formatCurrency(totalFilteredAmount)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor name, reference number, project, or description..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="Fuel">Fuel</option>
              <option value="Inventory / Materials">Inventory / Materials</option>
              <option value="Machinery Rental">Machinery Rental</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Labor">Labor</option>
              <option value="Subcontractor">Subcontractor</option>
              <option value="Tools and Equipment">Tools and Equipment</option>
              <option value="Utilities">Utilities</option>
              <option value="Permit / Government Fee">Permit / Government Fee</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Recorded">Recorded</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-md text-xs">
            <table className="w-full text-left text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Project & Site</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor & Ref #</th>
                  <th className="py-3 px-4 text-right">Amount (ETB)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No expense records matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{e.project?.projectName || 'General Office'}</span>
                        <span className="text-[10px] text-slate-500 block">{e.site?.siteName || 'Headquarters'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <ExpenseCategoryBadge category={e.expenseCategory} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{e.vendorName || 'N/A'}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">{e.referenceNumber || 'No Ref'}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ExpenseStatusBadge status={e.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {e.recordedBy ? `${e.recordedBy.firstName} ${e.recordedBy.lastName}` : 'System'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/finance/expenses/${e.id}`}
                            className="p-1 text-slate-400 hover:text-slate-900 rounded"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </Link>
                          {e.status !== 'Approved' && (
                            <Link
                              href={`/dashboard/finance/expenses/${e.id}/edit`}
                              className="p-1 text-slate-400 hover:text-slate-900 rounded"
                              title="Edit Expense"
                            >
                              <Edit3 size={15} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
