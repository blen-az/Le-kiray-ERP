'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  BarChart2,
  Building2,
  MapPin,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface ProjectCostSummary {
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
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-800',
  Planning: 'bg-amber-100 text-amber-800',
  Completed: 'bg-slate-100 text-slate-600',
  'On Hold': 'bg-orange-100 text-orange-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

export default function ProjectCostsPage() {
  const [projects, setProjects] = useState<ProjectCostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'totalCost' | 'budgetUtilization' | 'projectName'>('totalCost');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function load() {
      if (useMockData) {
        setProjects([
          {
            projectId: 'p-1', projectName: 'Bole Road Expansion', projectCode: 'BR-2026-01',
            clientName: 'AACRA', status: 'Active',
            budget: 12000000, totalCost: 4850000,
            fuelCost: 980000, maintenanceCost: 320000, materialCost: 2100000, laborCost: 950000, otherCost: 500000,
            budgetUtilization: 40.4,
          },
          {
            projectId: 'p-2', projectName: 'CMC Interchange', projectCode: 'CMC-2026-02',
            clientName: 'ERA', status: 'Active',
            budget: 18000000, totalCost: 7200000,
            fuelCost: 1450000, maintenanceCost: 680000, materialCost: 3200000, laborCost: 1400000, otherCost: 470000,
            budgetUtilization: 40.0,
          },
          {
            projectId: 'p-3', projectName: 'Ayat Condominium Phase 3', projectCode: 'AYT-2025-03',
            clientName: 'Condominium Agency', status: 'Active',
            budget: 8500000, totalCost: 5100000,
            fuelCost: 620000, maintenanceCost: 210000, materialCost: 3100000, laborCost: 890000, otherCost: 280000,
            budgetUtilization: 60.0,
          },
          {
            projectId: 'p-4', projectName: 'Addis Ketema Drain', projectCode: 'AKD-2025-01',
            clientName: 'AAWSA', status: 'Completed',
            budget: 5200000, totalCost: 5350000,
            fuelCost: 880000, maintenanceCost: 310000, materialCost: 2800000, laborCost: 1020000, otherCost: 340000,
            budgetUtilization: 102.9,
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/finance/by-project`);
        if (!res.ok) throw new Error('Failed to load project cost data');
        setProjects(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiUrl, useMockData]);

  const sorted = [...projects].sort((a, b) => {
    if (sortBy === 'totalCost') return b.totalCost - a.totalCost;
    if (sortBy === 'budgetUtilization') return (b.budgetUtilization || 0) - (a.budgetUtilization || 0);
    return a.projectName.localeCompare(b.projectName);
  });

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + p.totalCost, 0);
  const overBudget = projects.filter((p) => (p.budgetUtilization || 0) > 100).length;

  if (loading) return <LoadingState message="Loading project cost data..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/finance" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Cost by Project</h2>
            <p className="text-xs text-slate-500">Budget utilization and cost breakdown per project</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-[#0284c7]"
          >
            <option value="totalCost">Total Spent</option>
            <option value="budgetUtilization">Budget Used %</option>
            <option value="projectName">Project Name</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold">{error}</div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Budget</span>
          <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalBudget)}</div>
          <span className="text-[10px] text-slate-500">{projects.length} projects</span>
        </Card>
        <Card className="border border-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Spent</span>
          <div className="text-xl font-black text-[#0284c7] mt-1">{formatCurrency(totalSpent)}</div>
          <span className="text-[10px] text-slate-500">{totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of budget</span>
        </Card>
        <Card className="border border-slate-100 p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining</span>
          <div className={`text-xl font-black mt-1 ${totalBudget - totalSpent < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(totalBudget - totalSpent)}</div>
          <span className="text-[10px] text-slate-500">Overall budget balance</span>
        </Card>
        <Card className={`border p-4 ${overBudget > 0 ? 'border-rose-200 bg-rose-50' : 'border-slate-100'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Over Budget</span>
          <div className={`text-xl font-black mt-1 ${overBudget > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{overBudget}</div>
          <span className="text-[10px] text-slate-500">projects exceeding budget</span>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {sorted.map((p) => {
          const util = p.budgetUtilization ?? (p.budget ? (p.totalCost / p.budget) * 100 : 0);
          const isOverBudget = util > 100;
          const isAtRisk = util > 85 && util <= 100;

          return (
            <Card key={p.projectId} className="border border-slate-100 shadow-xs hover:shadow-sm transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{p.projectName}</h3>
                      {p.status && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>
                          {p.status}
                        </span>
                      )}
                      {isOverBudget && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 flex items-center gap-0.5">
                          <AlertCircle size={9} />OVER BUDGET
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{p.projectCode || ''} • {p.clientName || ''}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Spent</span>
                      <span className="text-base font-black text-slate-900">{formatCurrency(p.totalCost)}</span>
                    </div>
                    {p.budget && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Budget</span>
                        <span className="text-sm font-bold text-slate-500">{formatCurrency(p.budget)}</span>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/finance/projects/${p.projectId}`}
                      className="p-2 text-[#0284c7] hover:bg-sky-50 rounded-md"
                    >
                      <Eye size={16} />
                    </Link>
                  </div>
                </div>

                {/* Budget Bar */}
                {p.budget ? (
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>Budget Utilization</span>
                      <span className={isOverBudget ? 'text-rose-700' : isAtRisk ? 'text-amber-600' : 'text-slate-700'}>{util.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : isAtRisk ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(util, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                {/* Cost Breakdown Pills */}
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  {[
                    { label: 'Fuel', val: p.fuelCost, color: 'bg-amber-50 text-amber-800 border-amber-200' },
                    { label: 'Maintenance', val: p.maintenanceCost, color: 'bg-purple-50 text-purple-800 border-purple-200' },
                    { label: 'Materials', val: p.materialCost, color: 'bg-sky-50 text-sky-800 border-sky-200' },
                    { label: 'Labor', val: p.laborCost, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                    { label: 'Other', val: p.otherCost, color: 'bg-slate-50 text-slate-600 border-slate-200' },
                  ].filter((item) => item.val > 0).map((item) => (
                    <span key={item.label} className={`px-2 py-0.5 rounded-full border ${item.color}`}>
                      {item.label}: {formatCurrency(item.val)}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No project cost data available</p>
        </div>
      )}
    </div>
  );
}
