'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  AlertCircle,
  DollarSign,
  Fuel,
  Wrench,
  Package,
  Users,
  TrendingUp,
  BarChart2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';

interface ProjectFinanceDetail {
  projectId: string;
  projectName: string;
  projectCode?: string;
  clientName?: string;
  status?: string;
  budget?: number;
  totalCost: number;
  fuelCost: number;
  maintenanceCost: number;
  materialCost: number;
  laborCost: number;
  otherCost: number;
  budgetUtilization?: number;
  siteCosts?: {
    siteId: string;
    siteName: string;
    totalCost: number;
    fuelCost: number;
    maintenanceCost: number;
    materialCost: number;
    laborCost: number;
  }[];
  recentExpenses?: {
    id: string;
    expenseDate: string;
    expenseCategory: string;
    amount: number;
    vendorName?: string;
    status: string;
  }[];
}

export default function ProjectFinanceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<ProjectFinanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function load() {
      if (useMockData) {
        setData({
          projectId: id,
          projectName: 'Bole Road Expansion',
          projectCode: 'BR-2026-01',
          clientName: 'AACRA',
          status: 'Active',
          budget: 12000000,
          totalCost: 4850000,
          fuelCost: 980000,
          maintenanceCost: 320000,
          materialCost: 2100000,
          laborCost: 950000,
          otherCost: 500000,
          budgetUtilization: 40.4,
          siteCosts: [
            { siteId: 's-1', siteName: 'Olympia Junction', totalCost: 2800000, fuelCost: 550000, maintenanceCost: 180000, materialCost: 1200000, laborCost: 570000 },
            { siteId: 's-2', siteName: 'Sarbet Overpass', totalCost: 2050000, fuelCost: 430000, maintenanceCost: 140000, materialCost: 900000, laborCost: 380000 },
          ],
          recentExpenses: [
            { id: 'e-1', expenseDate: new Date(Date.now() - 86400000).toISOString(), expenseCategory: 'Fuel', amount: 45000, vendorName: 'Kality Fuel PLC', status: 'Approved' },
            { id: 'e-2', expenseDate: new Date(Date.now() - 172800000).toISOString(), expenseCategory: 'Materials', amount: 120000, vendorName: 'Addis Steel Factory', status: 'Approved' },
            { id: 'e-3', expenseDate: new Date(Date.now() - 259200000).toISOString(), expenseCategory: 'Maintenance', amount: 38000, vendorName: 'Heavy Mech Services', status: 'Recorded' },
          ],
        });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/finance/by-project?projectId=${id}`);
        if (!res.ok) throw new Error('Failed to load project finance data');
        setData(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, apiUrl, useMockData]);

  if (loading) return <LoadingState message="Loading project finance data..." />;
  if (!data || error) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Project finance data not found'}</div>
        <Link href="/dashboard/finance/projects" className="text-xs text-[#0284c7] underline font-semibold">
          Return to Projects Cost
        </Link>
      </div>
    );
  }

  const util = data.budgetUtilization ?? (data.budget ? (data.totalCost / data.budget) * 100 : 0);
  const isOverBudget = util > 100;
  const isAtRisk = util > 85 && util <= 100;

  const costCategories = [
    { label: 'Fuel', value: data.fuelCost, icon: <Fuel size={14} />, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
    { label: 'Materials', value: data.materialCost, icon: <Package size={14} />, color: 'text-sky-600', bgColor: 'bg-sky-50 border-sky-200' },
    { label: 'Labor', value: data.laborCost, icon: <Users size={14} />, color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
    { label: 'Maintenance', value: data.maintenanceCost, icon: <Wrench size={14} />, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
    { label: 'Other', value: data.otherCost, icon: <DollarSign size={14} />, color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/finance/projects" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">{data.projectName}</h2>
            {isOverBudget && (
              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded flex items-center gap-1">
                <AlertCircle size={10} /> OVER BUDGET
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{data.projectCode || ''} • Client: {data.clientName || 'N/A'} • Status: {data.status || 'Unknown'}</p>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="col-span-2 bg-slate-900 border-slate-800 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Cost</span>
          <div className="text-3xl font-black text-white mt-1">{formatCurrency(data.totalCost)}</div>
          <span className="text-[10px] text-slate-400">of {formatCurrency(data.budget || 0)} budget</span>
        </Card>
        <Card className="border border-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Budget Used</span>
          <div className={`text-xl font-black mt-1 ${isOverBudget ? 'text-rose-600' : isAtRisk ? 'text-amber-600' : 'text-slate-900'}`}>
            {util.toFixed(1)}%
          </div>
        </Card>
        <Card className="border border-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining</span>
          <div className={`text-xl font-black mt-1 ${(data.budget || 0) - data.totalCost < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency((data.budget || 0) - data.totalCost)}
          </div>
        </Card>
      </div>

      {/* Budget Progress Bar */}
      {data.budget && (
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-xs">
          <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
            <span>Budget Progress</span>
            <span className={isOverBudget ? 'text-rose-700' : isAtRisk ? 'text-amber-700' : 'text-emerald-700'}>
              {formatCurrency(data.totalCost)} / {formatCurrency(data.budget)}
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isOverBudget ? 'bg-rose-500' : isAtRisk ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(util, 100)}%`, transition: 'width 0.5s' }}
            />
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Cost Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {costCategories.map((cat) => (
              <div key={cat.label} className={`p-3 rounded-lg border ${cat.bgColor} text-center`}>
                <div className={`flex justify-center mb-1 ${cat.color}`}>{cat.icon}</div>
                <div className={`text-base font-black ${cat.color}`}>{formatCurrency(cat.value)}</div>
                <div className="text-[10px] font-bold text-slate-500 mt-0.5">{cat.label}</div>
                <div className="text-[10px] text-slate-400">
                  {data.totalCost > 0 ? ((cat.value / data.totalCost) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Site Cost Breakdown */}
      {data.siteCosts && data.siteCosts.length > 0 && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Cost by Site</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.siteCosts.map((site) => (
              <div key={site.siteId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-900">{site.siteName}</p>
                  <p className="text-[10px] text-slate-500">
                    Fuel: {formatCurrency(site.fuelCost)} • Materials: {formatCurrency(site.materialCost)} • Labor: {formatCurrency(site.laborCost)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">{formatCurrency(site.totalCost)}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {data.totalCost > 0 ? ((site.totalCost / data.totalCost) * 100).toFixed(1) : 0}% of project
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      {data.recentExpenses && data.recentExpenses.length > 0 && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">Recent Expenses</CardTitle>
            <Link href={`/dashboard/finance/expenses?projectId=${id}`} className="text-[10px] text-[#0284c7] font-semibold hover:underline flex items-center gap-1">
              View All <ExternalLink size={10} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Category</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Vendor</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-600 font-mono">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-slate-700 font-semibold">{exp.expenseCategory}</td>
                    <td className="px-4 py-2.5 text-slate-500">{exp.vendorName || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Link to Project Detail */}
      <div className="flex justify-end">
        <Link
          href={`/dashboard/projects/${id}`}
          className="flex items-center gap-1.5 text-xs text-[#0284c7] font-semibold hover:underline"
        >
          <ExternalLink size={13} />
          Open Full Project Details
        </Link>
      </div>
    </div>
  );
}
