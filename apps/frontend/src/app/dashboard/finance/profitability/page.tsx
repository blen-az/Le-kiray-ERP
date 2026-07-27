'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Building2,
  BarChart2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';
import RequirePermission from '@/components/auth/RequirePermission';

interface ProjectProfitability {
  projectId: string;
  projectName: string;
  projectCode?: string;
  clientName?: string;
  status?: string;
  contractValue?: number;
  totalCost: number;
  grossProfit?: number;
  profitMargin?: number;
  budgetUtilization?: number;
  isOverBudget?: boolean;
}

export default function ProfitabilityPage() {
  const [projects, setProjects] = useState<ProjectProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function load() {
      if (useMockData) {
        setProjects([
          {
            projectId: 'p-1', projectName: 'Bole Road Expansion', projectCode: 'BR-2026-01',
            clientName: 'AACRA', status: 'Active',
            contractValue: 15000000, totalCost: 4850000,
            grossProfit: 10150000, profitMargin: 67.7, budgetUtilization: 40.4,
          },
          {
            projectId: 'p-2', projectName: 'CMC Interchange', projectCode: 'CMC-2026-02',
            clientName: 'ERA', status: 'Active',
            contractValue: 22000000, totalCost: 7200000,
            grossProfit: 14800000, profitMargin: 67.3, budgetUtilization: 40.0,
          },
          {
            projectId: 'p-3', projectName: 'Ayat Condominium Phase 3', projectCode: 'AYT-2025-03',
            clientName: 'Condominium Agency', status: 'Active',
            contractValue: 9800000, totalCost: 5100000,
            grossProfit: 4700000, profitMargin: 48.0, budgetUtilization: 60.0,
          },
          {
            projectId: 'p-4', projectName: 'Addis Ketema Drain', projectCode: 'AKD-2025-01',
            clientName: 'AAWSA', status: 'Completed',
            contractValue: 5000000, totalCost: 5350000,
            grossProfit: -350000, profitMargin: -7.0, budgetUtilization: 102.9, isOverBudget: true,
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/finance/profitability`);
        if (!res.ok) throw new Error('Failed to load profitability data');
        setProjects(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [apiUrl, useMockData]);

  if (loading) return <LoadingState message="Loading profitability data..." />;

  const totalRevenue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
  const totalCost = projects.reduce((s, p) => s + p.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const overBudgetCount = projects.filter((p) => p.isOverBudget || (p.budgetUtilization || 0) > 100).length;

  return (
    <RequirePermission permission="finance:profitability">
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/finance" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Project Profitability</h2>
          <p className="text-xs text-slate-500">Contract value vs actual cost — gross profit margin per project</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold">{error}</div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Revenue</span>
          <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalRevenue)}</div>
          <span className="text-[10px] text-slate-500">contract values</span>
        </Card>
        <Card className="border border-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Cost</span>
          <div className="text-xl font-black text-[#0284c7] mt-1">{formatCurrency(totalCost)}</div>
          <span className="text-[10px] text-slate-500">actual expenses</span>
        </Card>
        <Card className={`p-4 border ${totalProfit < 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-100 bg-emerald-50'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Gross Profit</span>
          <div className={`text-xl font-black mt-1 ${totalProfit < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{formatCurrency(totalProfit)}</div>
          <span className="text-[10px] text-slate-500">{overallMargin.toFixed(1)}% margin</span>
        </Card>
        <Card className={`p-4 border ${overBudgetCount > 0 ? 'border-rose-200 bg-rose-50' : 'border-slate-100'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Over Budget</span>
          <div className={`text-xl font-black mt-1 ${overBudgetCount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{overBudgetCount}</div>
          <span className="text-[10px] text-slate-500">projects over budget</span>
        </Card>
      </div>

      {/* Profitability Table */}
      <Card className="border border-slate-100 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Project Profitability Breakdown</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Project</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Contract Value</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Actual Cost</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Gross Profit</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Margin</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Budget Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projects.map((p) => {
                const profit = p.grossProfit ?? ((p.contractValue || 0) - p.totalCost);
                const margin = p.profitMargin ?? (p.contractValue ? (profit / p.contractValue) * 100 : 0);
                const util = p.budgetUtilization ?? 0;
                const isProfitable = profit >= 0;
                const isOverB = util > 100;

                return (
                  <tr key={p.projectId} className="hover:bg-slate-50 group">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/finance/projects/${p.projectId}`} className="group-hover:text-[#0284c7] font-bold text-slate-900">
                        {p.projectName}
                      </Link>
                      <p className="text-[10px] text-slate-400 font-mono">{p.projectCode} • {p.clientName}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {p.contractValue ? formatCurrency(p.contractValue) : <span className="text-slate-400 font-normal">N/A</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0284c7]">{formatCurrency(p.totalCost)}</td>
                    <td className={`px-4 py-3 text-right font-black ${isProfitable ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {p.contractValue ? (
                        <span className="flex items-center justify-end gap-1">
                          {isProfitable ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {formatCurrency(profit)}
                        </span>
                      ) : <span className="text-slate-400 font-normal">N/A</span>}
                    </td>
                    <td className={`px-4 py-3 text-right font-black ${margin >= 30 ? 'text-emerald-700' : margin >= 10 ? 'text-amber-600' : 'text-rose-700'}`}>
                      {p.contractValue ? `${margin.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-black text-xs ${isOverB ? 'text-rose-700' : util > 85 ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {util.toFixed(1)}%
                        </span>
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isOverB ? 'bg-rose-500' : util > 85 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(util, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <div className="flex items-start gap-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>Finance Lite Note:</strong> This is a cost tracking view only. Contract values are estimates from project records.
            Gross profit shown is a simplified calculation and does not account for VAT, withholding tax, retention, or indirect overhead.
            For full financial reporting, integrate with an accounting system.
          </div>
        </div>
      </div>
    </div>
    </RequirePermission>
  );
}
