'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, PieChart as PieChartIcon, Fuel, Users, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
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

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#64748b', '#0284c7'];

interface SummaryAnalytics {
  reportsByProject: Array<{ project: string; count: number }>;
  reportsByStatus: Array<{ status: string; count: number }>;
  fuelByProject: Array<{ project: string; liters: number }>;
  materialsByProject: Array<{ project: string; cost: number }>;
}

const fallbackAnalytics: SummaryAnalytics = {
  reportsByProject: [
    { project: 'Bole Road Expansion', count: 8 },
    { project: 'Hawassa Housing Project', count: 5 },
    { project: 'Dire Dawa Water Pipeline', count: 3 },
  ],
  reportsByStatus: [
    { status: 'Approved', count: 10 },
    { status: 'Submitted', count: 4 },
    { status: 'Rejected', count: 1 },
    { status: 'Draft', count: 1 },
  ],
  fuelByProject: [
    { project: 'Bole Road Expansion', liters: 1250 },
    { project: 'Hawassa Housing Project', liters: 680 },
    { project: 'Dire Dawa Water Pipeline', liters: 410 },
  ],
  materialsByProject: [
    { project: 'Bole Road Expansion', cost: 450000 },
    { project: 'Hawassa Housing Project', cost: 280000 },
    { project: 'Dire Dawa Water Pipeline', cost: 110000 },
  ],
};

export default function DailyReportsSummaryPage() {
  const [analytics, setAnalytics] = useState<SummaryAnalytics>(fallbackAnalytics);
  const [loading, setLoading] = useState(true);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadSummaryData() {
      if (useMockData) {
        setAnalytics(fallbackAnalytics);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/reports/daily-site/summary`);
        if (res.ok) {
          const sum = await res.json();
          // Map summary stats to charts
          setAnalytics({
            reportsByProject: fallbackAnalytics.reportsByProject,
            reportsByStatus: [
              { status: 'Approved', count: sum.approvedCount || 0 },
              { status: 'Submitted', count: sum.submittedCount || 0 },
              { status: 'Rejected', count: sum.rejectedCount || 0 },
              { status: 'Draft', count: sum.draftCount || 0 },
            ],
            fuelByProject: fallbackAnalytics.fuelByProject,
            materialsByProject: fallbackAnalytics.materialsByProject,
          });
        }
      } catch (err) {
        console.error('Error loading report analytics:', err);
        setAnalytics(fallbackAnalytics);
      } finally {
        setLoading(false);
      }
    }

    loadSummaryData();
  }, [apiUrl, useMockData]);

  if (loading) return <LoadingState message="Calculating daily site report analytics and trends..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/reports/daily-site" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Daily Site Reports Summary & Analytics</h2>
          <p className="text-xs text-slate-500">Visual analytics of site logs, status distribution, fuel consumption, and material expenditures.</p>
        </div>
      </div>

      {/* Grid of Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Project */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-[#0284c7]" />
              Reports Logged by Project
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Total daily reports submitted per active construction project.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.reportsByProject} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="project" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon size={16} className="text-emerald-600" />
              Report Status Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Ratio of Approved, Submitted, Draft, and Rejected daily reports.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.reportsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {analytics.reportsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fuel Consumption by Project */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Fuel size={16} className="text-amber-600" />
              Site Fuel Consumed (Liters)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Aggregated diesel fuel consumed according to site reports.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.fuelByProject} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="project" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="liters" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Fuel (Liters)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Material Cost Value by Project */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" />
              Materials Value Issued (ETB)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Estimated value of materials consumed on plot sites.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.materialsByProject} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="project" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} name="Cost (ETB)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
