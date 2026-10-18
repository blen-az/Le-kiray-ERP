'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Plus,
  Search,
  Building2,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Droplet,
  Warehouse,
  Wrench,
  Users,
  Truck,
  Eye,
  ShieldAlert,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ExpenseCategoryBadge } from '@/components/finance/ExpenseCategoryBadge';
import { ExpenseStatusBadge } from '@/components/finance/ExpenseStatusBadge';
import { CostRiskBadge } from '@/components/finance/CostRiskBadge';
import { formatCurrency } from '@/lib/utils';
import { PermissionGate } from '@/components/auth/RequirePermission';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { apiFetch } from '@/lib/api';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

interface FinanceSummary {
  totalOperationalCost: number;
  monthlyFuelCost: number;
  monthlyInventoryCost: number;
  monthlyMaintenanceCost: number;
  monthlyLaborCostEstimate: number;
  monthlyMachineryRentalCost: number;
  monthlyManualExpenses: number;
  highestCostProject: { id: string; projectName: string; totalCost: number } | null;
  projectsAtRiskCount: number;
  recentExpenses: Array<{
    id: string;
    expenseDate: string;
    expenseCategory: string;
    amount: number;
    currency: string;
    status: string;
    vendorName?: string;
    referenceNumber?: string;
    project?: { id: string; projectName: string };
    site?: { id: string; siteName: string };
  }>;
}

const fallbackSummary: FinanceSummary = {
  totalOperationalCost: 312500,
  monthlyFuelCost: 45000,
  monthlyInventoryCost: 38000,
  monthlyMaintenanceCost: 54000,
  monthlyLaborCostEstimate: 85500,
  monthlyMachineryRentalCost: 42000,
  monthlyManualExpenses: 48000,
  highestCostProject: { id: 'p-1', projectName: 'Bole Road Expansion', totalCost: 185000 },
  projectsAtRiskCount: 1,
  recentExpenses: [
    {
      id: 'exp-1',
      expenseDate: new Date(Date.now() - 86400000).toISOString(),
      expenseCategory: 'Fuel',
      amount: 45000,
      currency: 'ETB',
      status: 'Approved',
      vendorName: 'Kality Fuel Transports PLC',
      referenceNumber: 'INV-2026-0891',
      project: { id: 'p-1', projectName: 'Bole Road Expansion' },
      site: { id: 's-1', siteName: 'Olympia Junction Site' },
    },
    {
      id: 'exp-2',
      expenseDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      expenseCategory: 'Subcontractor',
      amount: 120000,
      currency: 'ETB',
      status: 'Approved',
      vendorName: 'Hawassa Masonry Union Subcontractors',
      referenceNumber: 'SUB-HW-042',
      project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
      site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
    },
    {
      id: 'exp-3',
      expenseDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      expenseCategory: 'Utilities',
      amount: 18500,
      currency: 'ETB',
      status: 'Recorded',
      vendorName: 'Ethiopian Electric Utility',
      referenceNumber: 'EEU-DD-9921',
      project: { id: 'p-3', projectName: 'Dire Dawa Water Pipeline' },
    },
  ],
};

export default function FinanceDashboardPage() {
  const [summary, setSummary] = useState<FinanceSummary>(fallbackSummary);
  const [loading, setLoading] = useState(true);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadFinanceSummary() {
      if (useMockData) {
        setSummary(fallbackSummary);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/finance/summary`);
        if (res.ok) setSummary(await res.json());
      } catch (err) {
        console.error('Error loading finance summary:', err);
        setSummary(fallbackSummary);
      } finally {
        setLoading(false);
      }
    }

    loadFinanceSummary();
  }, [apiUrl, useMockData]);

  if (loading) return <LoadingState message="Aggregating operational costs across Projects, Sites, Machinery, Fuel, Inventory, Maintenance, and Workforce..." />;

  const costDistribution = [
    { name: 'Fuel Cost', amount: summary.monthlyFuelCost },
    { name: 'Inventory / Materials', amount: summary.monthlyInventoryCost },
    { name: 'Maintenance', amount: summary.monthlyMaintenanceCost },
    { name: 'Labor (Estimated)', amount: summary.monthlyLaborCostEstimate },
    { name: 'Machinery Rental', amount: summary.monthlyMachineryRentalCost },
    { name: 'Manual Expenses', amount: summary.monthlyManualExpenses },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Finance Lite & Operational Cost Control</h2>
            <span className="text-[10px] bg-sky-100 text-[#0284c7] font-extrabold px-2 py-0.5 rounded-full uppercase">Operational View</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time operational cost tracking by project, site, heavy machinery, fuel, materials, maintenance, and workforce.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PermissionGate permission="finance:profitability">
            <Link
              href="/dashboard/finance/profitability"
              className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
            >
              <TrendingUp size={14} />
              Profitability Estimator
            </Link>
          </PermissionGate>
          <Link
            href="/dashboard/finance/reports"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <FileText size={14} />
            Cost Reports
          </Link>
          <Link
            href="/dashboard/finance/expenses/new"
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-xs transition-colors"
          >
            <Plus size={15} />
            Record Expense
          </Link>
        </div>
      </div>

      {/* Operational Disclaimer Note */}
      <div className="p-3 bg-amber-50/80 border border-amber-200/80 text-amber-900 rounded-md text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span><strong>Operational Cost Estimate:</strong> Labor and equipment rental costs are operational estimates aggregated from active site logs, daily rates, and machinery assignments for project control.</span>
        </div>
        <Link href="/dashboard/finance/projects" className="text-[11px] font-bold text-amber-900 underline shrink-0">
          View Projects →
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-xs bg-slate-900 text-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Operational Cost (Month)</span>
          <div className="text-2xl font-black text-white mt-1">{formatCurrency(summary.totalOperationalCost)}</div>
          <div className="text-[10px] text-sky-400 mt-2 font-medium flex items-center justify-between">
            <span>Aggregated 6 Sources</span>
            <span>ETB</span>
          </div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Highest Cost Project</span>
          <div className="text-lg font-black text-slate-900 mt-1 truncate" title={summary.highestCostProject?.projectName}>
            {summary.highestCostProject?.projectName || 'None'}
          </div>
          <span className="text-xs font-bold text-rose-600 block mt-0.5">
            {formatCurrency(summary.highestCostProject?.totalCost || 0)} Total Cost
          </span>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Projects Over / Near Budget</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{summary.projectsAtRiskCount} Projects</div>
          <span className="text-[10px] text-rose-500 font-semibold">Cost overrun risk alert</span>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manual Expenses Recorded</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(summary.monthlyManualExpenses)}</div>
          <span className="text-[10px] text-slate-500 font-medium">Subcontractor, Permits, Tools</span>
        </Card>
      </div>

      {/* Category Cost Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border border-slate-100 shadow-xs p-3">
          <div className="flex items-center gap-1.5 text-amber-600 mb-1">
            <Droplet size={14} />
            <span className="text-[10px] font-bold uppercase text-slate-500">Fuel Cost</span>
          </div>
          <div className="text-sm font-black text-slate-900">{formatCurrency(summary.monthlyFuelCost)}</div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <div className="flex items-center gap-1.5 text-sky-600 mb-1">
            <Warehouse size={14} />
            <span className="text-[10px] font-bold uppercase text-slate-500">Materials Cost</span>
          </div>
          <div className="text-sm font-black text-slate-900">{formatCurrency(summary.monthlyInventoryCost)}</div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <div className="flex items-center gap-1.5 text-rose-600 mb-1">
            <Wrench size={14} />
            <span className="text-[10px] font-bold uppercase text-slate-500">Maintenance</span>
          </div>
          <div className="text-sm font-black text-slate-900">{formatCurrency(summary.monthlyMaintenanceCost)}</div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase text-slate-500">Labor (Est.)</span>
          </div>
          <div className="text-sm font-black text-slate-900">{formatCurrency(summary.monthlyLaborCostEstimate)}</div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
            <Truck size={14} />
            <span className="text-[10px] font-bold uppercase text-slate-500">Rental (Est.)</span>
          </div>
          <div className="text-sm font-black text-slate-900">{formatCurrency(summary.monthlyMachineryRentalCost)}</div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <div className="flex items-center gap-1.5 text-purple-600 mb-1">
            <CreditCard size={14} />
            <span className="text-[10px] font-bold uppercase text-slate-500">Expenses</span>
          </div>
          <div className="text-sm font-black text-slate-900">{formatCurrency(summary.monthlyManualExpenses)}</div>
        </Card>
      </div>

      {/* Visual Chart & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Pie Chart (Left 2 cols) */}
        <Card className="border border-slate-100 shadow-xs lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Operational Cost Distribution</CardTitle>
              <CardDescription className="text-xs text-slate-500">Breakdown of monthly expenditures by cost center category.</CardDescription>
            </div>
            <Link href="/dashboard/finance/reports" className="text-xs text-[#0284c7] font-semibold hover:underline flex items-center gap-1">
              View Detailed Analytics <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent className="pt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costDistribution} margin={{ top: 10, right: 20, left: 15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="amount" fill="#0284c7" radius={[4, 4, 0, 0]} name="Cost (ETB)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Manual Expenses List (Right 1 col) */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">Recent Manual Expenses</CardTitle>
            <Link href="/dashboard/finance/expenses" className="text-xs text-[#0284c7] font-semibold hover:underline">
              View All →
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {summary.recentExpenses.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">No manual expenses recorded.</div>
            ) : (
              summary.recentExpenses.map((exp) => (
                <div key={exp.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-md text-xs space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">{exp.project?.projectName || 'General Office'}</span>
                    <ExpenseStatusBadge status={exp.status} />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <ExpenseCategoryBadge category={exp.expenseCategory} />
                    <span className="font-bold text-emerald-700">{formatCurrency(exp.amount)}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate" title={exp.vendorName}>
                    Vendor: {exp.vendorName || 'N/A'} • Ref: {exp.referenceNumber || 'N/A'}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
