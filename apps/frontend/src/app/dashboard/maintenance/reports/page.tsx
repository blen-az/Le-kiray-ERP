'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, PieChart as PieChartIcon, Wrench, Clock, DollarSign, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
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

interface MaintenanceReportData {
  costByMachine: Array<{ machine: string; totalCost: number; downtimeHours: number; count: number }>;
  costByProject: Array<{ project: string; totalCost: number; count: number }>;
  typeBreakdown: Array<{ type: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
}

const fallbackReports: MaintenanceReportData = {
  costByMachine: [
    { machine: 'CAT 320D Excavator', totalCost: 18000, downtimeHours: 5.5, count: 1 },
    { machine: 'Sinotruk Howo Dump Truck', totalCost: 25500, downtimeHours: 3.0, count: 1 },
    { machine: 'Volvo L90 Loader', totalCost: 10500, downtimeHours: 0.0, count: 1 },
    { machine: 'CAT 140H Grader', totalCost: 45000, downtimeHours: 12.0, count: 1 },
  ],
  costByProject: [
    { project: 'Bole Road Expansion', totalCost: 43500, count: 2 },
    { project: 'Hawassa Housing Project', totalCost: 10500, count: 1 },
    { project: 'Dire Dawa Water Pipeline', totalCost: 45000, count: 1 },
  ],
  typeBreakdown: [
    { type: 'Breakdown Repair', count: 2 },
    { type: 'Preventive Maintenance', count: 1 },
    { type: 'Tire Service', count: 1 },
  ],
  statusBreakdown: [
    { status: 'Completed', count: 1 },
    { status: 'In Progress', count: 1 },
    { status: 'Scheduled', count: 1 },
    { status: 'Reported', count: 1 },
  ],
};

export default function MaintenanceReportsPage() {
  const [data, setData] = useState<MaintenanceReportData>(fallbackReports);
  const [loading, setLoading] = useState(true);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadReportsData() {
      if (useMockData) {
        setData(fallbackReports);
        setLoading(false);
        return;
      }

      try {
        const [macRes, projRes, sumRes] = await Promise.all([
          apiFetch(`${apiUrl}/maintenance/reports/by-machine`),
          apiFetch(`${apiUrl}/maintenance/reports/by-project`),
          apiFetch(`${apiUrl}/maintenance/reports/summary`),
        ]);

        const costByMachine = macRes.ok ? await macRes.json() : fallbackReports.costByMachine;
        const costByProject = projRes.ok ? await projRes.json() : fallbackReports.costByProject;

        setData({
          costByMachine,
          costByProject,
          typeBreakdown: fallbackReports.typeBreakdown,
          statusBreakdown: fallbackReports.statusBreakdown,
        });
      } catch (err) {
        console.error('Error loading maintenance reports:', err);
        setData(fallbackReports);
      } finally {
        setLoading(false);
      }
    }

    loadReportsData();
  }, [apiUrl, useMockData]);

  if (loading) return <LoadingState message="Aggregating maintenance cost reports & machine downtime analytics..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/maintenance" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Maintenance Cost & Downtime Analytics</h2>
          <p className="text-xs text-slate-500">Visual report of maintenance expenditures per machine asset, project contract, and downtime hours.</p>
        </div>
      </div>

      {/* Grid of Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Cost by Machine */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" />
              Maintenance Cost by Machine (ETB)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Total repair and parts cost per heavy machinery unit.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.costByMachine} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="machine" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="totalCost" fill="#10b981" radius={[4, 4, 0, 0]} name="Cost (ETB)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Machine Downtime Hours */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-rose-600" />
              Equipment Downtime (Hours)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Lost operational hours per machine breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.costByMachine} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="machine" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="downtimeHours" fill="#ef4444" radius={[4, 4, 0, 0]} name="Downtime (hrs)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost by Project */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-[#0284c7]" />
              Maintenance Cost by Project Contract
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Total fleet repair expenses charged per project contract.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.costByProject} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="project" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="totalCost" fill="#0284c7" radius={[4, 4, 0, 0]} name="Cost (ETB)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenance Types Breakdown */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon size={16} className="text-amber-600" />
              Maintenance Records by Type
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Distribution of breakdown vs preventive service logs.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.typeBreakdown}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.typeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
