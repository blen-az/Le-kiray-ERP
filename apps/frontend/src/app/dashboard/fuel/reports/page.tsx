'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart4, Droplet, DollarSign, Truck, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { formatCurrency } from '@/lib/utils';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

export default function FuelReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [byProject, setByProject] = useState<any[]>([]);
  const [byMachine, setByMachine] = useState<any[]>([]);
  const [byOperator, setByOperator] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    const loadReports = async () => {
      if (useMockData) {
        setSummary({ totalCost: 35360, totalLiters: 320, averageCost: 110.5, pendingRequestsCount: 1 });
        setByProject([
          { projectName: 'Bole Road Expansion', totalLiters: 320, totalCost: 35360 },
          { projectName: 'Hawassa Housing Project', totalLiters: 0, totalCost: 0 },
        ]);
        setByMachine([
          { machineId: 'm-1', brand: 'CAT', model: '320D', plateNumber: 'ET-3-A1234', totalLiters: 200, totalCost: 22100 },
          { machineId: 'm-2', brand: 'Volvo', model: 'L90', plateNumber: 'ET-3-A4321', totalLiters: 120, totalCost: 13260 },
        ]);
        setByOperator([
          { operatorId: 'emp-1', operatorName: 'Abebe Kebede', totalLiters: 200, totalCost: 22100 },
          { operatorId: 'emp-2', operatorName: 'Tariku Mengistu', totalLiters: 120, totalCost: 13260 },
        ]);
        setLoading(false);
        return;
      }

      try {
        const [sumRes, projRes, machRes, opRes] = await Promise.all([
          fetch(`${apiUrl}/fuel/reports/summary`),
          fetch(`${apiUrl}/fuel/reports/by-project`),
          fetch(`${apiUrl}/fuel/reports/by-machine`),
          fetch(`${apiUrl}/fuel/reports/by-operator`),
        ]);
        if (sumRes.ok) setSummary(await sumRes.json());
        if (projRes.ok) setByProject(await projRes.json());
        if (machRes.ok) setByMachine(await machRes.json());
        if (opRes.ok) setByOperator(await opRes.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [useMockData, apiUrl]);

  if (loading) return <LoadingState message="Loading fuel reports..." />;
  if (error) return <ErrorState message={error} />;

  const projectPieData = byProject.filter(p => p.totalCost > 0).map(p => ({
    name: p.projectName,
    value: p.totalCost,
  }));

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/fuel" className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs text-slate-500 font-medium">Fuel Management</span>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-slate-700">Fuel Cost Reports</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-[#0284c7] text-white p-2.5 rounded-lg">
          <BarChart4 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fuel Cost Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Breakdown of diesel consumption across projects, machinery, and operators.</p>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Fuel Cost', value: formatCurrency(summary.totalCost), icon: <DollarSign size={16} />, color: 'sky' },
            { label: 'Total Liters Used', value: `${summary.totalLiters.toFixed(1)} L`, icon: <Droplet size={16} />, color: 'emerald' },
            { label: 'Average Rate/Liter', value: formatCurrency(summary.averageCost), icon: <BarChart4 size={16} />, color: 'indigo' },
            { label: 'Pending Requests', value: summary.pendingRequestsCount, icon: <Droplet size={16} />, color: 'amber' },
          ].map(({ label, value, icon, color }) => (
            <Card key={label} className="border border-slate-100 shadow-xs">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{label}</span>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{value}</p>
                </div>
                <div className={`bg-${color}-50 text-${color}-600 p-2 rounded-lg`}>{icon}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Project Bar Chart */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin size={13} className="text-[#0284c7]" /> Cost by Project (ETB)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProject}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="projectName" stroke="#94a3b8" fontSize={9} tickLine={false}
                    tickFormatter={v => v.length > 14 ? v.slice(0, 14) + '…' : v} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                  <Bar dataKey="totalCost" fill="#0284c7" radius={[4, 4, 0, 0]} name="Total Cost" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Project Pie */}
        {projectPieData.length > 0 && (
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={13} className="text-indigo-600" /> Cost Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={10}>
                      {projectPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* By Machine Table */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-50">
          <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Truck size={13} className="text-[#0284c7]" /> Consumption by Machine
          </CardTitle>
          <CardDescription>Top diesel consumers across all machinery fleet.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-3 px-4">Machine</th>
                <th className="py-3 px-4 text-right">Liters Used</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 w-40">Usage Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byMachine.sort((a, b) => b.totalLiters - a.totalLiters).map((m, i) => {
                const maxLiters = byMachine[0]?.totalLiters || 1;
                const pct = Math.round((m.totalLiters / maxLiters) * 100);
                return (
                  <tr key={m.machineId} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{m.brand} {m.model}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">{m.plateNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{m.totalLiters.toFixed(1)} L</td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">{formatCurrency(m.totalCost)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-[#0284c7]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500 w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* By Operator Table */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-50">
          <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">Consumption by Operator</CardTitle>
          <CardDescription>Diesel usage attributed per machine operator.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-right">Liters Used</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byOperator.sort((a, b) => b.totalLiters - a.totalLiters).map(op => (
                <tr key={op.operatorId || 'unassigned'} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{op.operatorName}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{op.totalLiters.toFixed(1)} L</td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">{formatCurrency(op.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
