'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, PieChart as PieChartIcon, TrendingUp, Users, Clock, CalendarCheck } from 'lucide-react';
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

interface ReportsData {
  byProject: Array<{ project: string; count: number }>;
  byPosition: Array<{ position: string; count: number }>;
  byAttendanceStatus: Array<{ status: string; count: number }>;
  overtimeByProject: Array<{ project: string; hours: number }>;
}

const fallbackReports: ReportsData = {
  byProject: [
    { project: 'Bole Road Expansion', count: 5 },
    { project: 'Hawassa Housing Project', count: 3 },
    { project: 'Dire Dawa Water Pipeline', count: 2 },
    { project: 'Unassigned Fleet Yard', count: 1 },
  ],
  byPosition: [
    { position: 'Machine Operator', count: 2 },
    { position: 'Site Manager', count: 1 },
    { position: 'Driver', count: 1 },
    { position: 'Inventory Manager', count: 1 },
    { position: 'Mechanic', count: 1 },
    { position: 'HR Officer', count: 1 },
    { position: 'Foreman', count: 1 },
    { position: 'Laborer / Mason', count: 3 },
  ],
  byAttendanceStatus: [
    { status: 'Present', count: 5 },
    { status: 'Late', count: 1 },
    { status: 'Absent', count: 1 },
    { status: 'On Leave', count: 1 },
  ],
  overtimeByProject: [
    { project: 'Bole Road Expansion', hours: 12 },
    { project: 'Hawassa Housing Project', hours: 4 },
    { project: 'Dire Dawa Water Pipeline', hours: 0 },
  ],
};

export default function HrReportsPage() {
  const [data, setData] = useState<ReportsData>(fallbackReports);
  const [loading, setLoading] = useState(true);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadReports() {
      if (useMockData) {
        setData(fallbackReports);
        setLoading(false);
        return;
      }

      try {
        const [projRes, posRes, attRes, otRes] = await Promise.all([
          apiFetch(`${apiUrl}/hr/reports/employees-by-project`),
          apiFetch(`${apiUrl}/hr/reports/employees-by-position`),
          apiFetch(`${apiUrl}/hr/reports/attendance-summary`),
          apiFetch(`${apiUrl}/hr/reports/overtime-by-project`),
        ]);

        const projData = projRes.ok ? await projRes.json() : fallbackReports.byProject;
        const posData = posRes.ok ? await posRes.json() : fallbackReports.byPosition;
        const attData = attRes.ok ? await attRes.json() : fallbackReports.byAttendanceStatus;
        const otData = otRes.ok ? await otRes.json() : fallbackReports.overtimeByProject;

        setData({
          byProject: projData,
          byPosition: posData,
          byAttendanceStatus: attData,
          overtimeByProject: otData,
        });
      } catch (err) {
        console.error('Error fetching HR reports:', err);
        setData(fallbackReports);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [apiUrl, useMockData]);

  if (loading) return <LoadingState message="Calculating workforce analytics and charts..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/hr" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Workforce Analytics & Reports</h2>
          <p className="text-xs text-slate-500">Visual breakdowns of site workforce deployment, position ratios, and overtime distribution.</p>
        </div>
      </div>

      {/* Grid of Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees by Project */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-[#0284c7]" />
              Workforce Deployment by Project
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Number of active employees deployed on site contracts.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byProject} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="project" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Status Ratio */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon size={16} className="text-emerald-600" />
              Daily Attendance Status Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Distribution of present, late, absent, and on-leave staff today.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byAttendanceStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.byAttendanceStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overtime Hours by Project */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              Overtime Hours Logged by Project
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Total accumulated overtime hours worked this week.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.overtimeByProject} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="project" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Overtime Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employees by Position */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-600" />
              Position Composition
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Skill and designation distribution across contractor workforce.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byPosition} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="position" tick={{ fontSize: 10, fill: '#64748b' }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Workers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
