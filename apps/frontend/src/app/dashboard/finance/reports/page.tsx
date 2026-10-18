'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart2,
  TrendingUp,
  DollarSign,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

const COLORS = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];

const MONTHLY_MOCK = [
  { month: 'Feb', fuel: 720000, materials: 1200000, maintenance: 220000, labor: 650000, other: 180000 },
  { month: 'Mar', fuel: 850000, materials: 1800000, maintenance: 310000, labor: 820000, other: 240000 },
  { month: 'Apr', fuel: 910000, materials: 2100000, maintenance: 280000, labor: 890000, other: 210000 },
  { month: 'May', fuel: 780000, materials: 1650000, maintenance: 350000, labor: 760000, other: 190000 },
  { month: 'Jun', fuel: 1050000, materials: 2300000, maintenance: 420000, labor: 980000, other: 280000 },
  { month: 'Jul', fuel: 980000, materials: 2100000, maintenance: 320000, labor: 950000, other: 245000 },
];

const PROJECT_MOCK = [
  { name: 'Bole Road', totalCost: 4850000, budget: 12000000 },
  { name: 'CMC Interchange', totalCost: 7200000, budget: 18000000 },
  { name: 'Ayat Condo P3', totalCost: 5100000, budget: 8500000 },
  { name: 'Addis Ketema', totalCost: 5350000, budget: 5200000 },
];

const PIE_MOCK = [
  { name: 'Materials', value: 9150000 },
  { name: 'Fuel', value: 4290000 },
  { name: 'Labor', value: 4050000 },
  { name: 'Maintenance', value: 1900000 },
  { name: 'Other', value: 1145000 },
];

const formatMillions = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-bold text-slate-800 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4 text-[11px]">
          <span style={{ color: entry.color }} className="font-semibold">{entry.name}</span>
          <span className="font-bold text-slate-900">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function FinanceReportsPage() {
  const [monthlyData, setMonthlyData] = useState(MONTHLY_MOCK);
  const [projectData, setProjectData] = useState(PROJECT_MOCK);
  const [pieData, setPieData] = useState(PIE_MOCK);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('6M');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    if (useMockData) return;

    const load = async () => {
      setLoading(true);
      try {
        const [montRes, projRes] = await Promise.all([
          apiFetch(`${apiUrl}/finance/summary?period=${period}`),
          apiFetch(`${apiUrl}/finance/by-project`),
        ]);

        if (montRes.ok) {
          const d = await montRes.json();
          if (d.monthly) setMonthlyData(d.monthly);
          if (d.categories) setPieData(d.categories.map((c: any) => ({ name: c.label, value: c.total })));
        }

        if (projRes.ok) {
          const projs = await projRes.json();
          setProjectData(projs.slice(0, 8).map((p: any) => ({
            name: p.projectName?.split(' ').slice(0, 2).join(' ') || 'Unknown',
            totalCost: p.totalCost || 0,
            budget: p.budget || 0,
          })));
        }
      } catch (_) {}
      finally { setLoading(false); }
    };

    load();
  }, [period, apiUrl, useMockData]);

  if (loading) return <LoadingState message="Loading finance reports..." />;

  const totalSpent = PIE_MOCK.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/finance" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Finance Reports</h2>
            <p className="text-xs text-slate-500">Visual cost analytics and trends</p>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {['3M', '6M', '12M'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Cost Trend */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#0284c7]" />
            <CardTitle className="text-sm font-bold text-slate-900">Monthly Cost Trend</CardTitle>
          </div>
          <p className="text-[10px] text-slate-400">Stacked cost categories per month</p>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickFormatter={formatMillions} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="fuel" name="Fuel" stackId="a" fill="#d97706" radius={[0, 0, 0, 0]} />
              <Bar dataKey="materials" name="Materials" stackId="a" fill="#0284c7" />
              <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#7c3aed" />
              <Bar dataKey="labor" name="Labor" stackId="a" fill="#059669" />
              <Bar dataKey="other" name="Other" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two column: Pie + Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-purple-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Cost by Category</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-2 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[10px]">{totalSpent > 0 ? ((item.value / totalSpent) * 100).toFixed(1) : 0}%</span>
                    <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Budget vs Spend */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-emerald-600" />
              <CardTitle className="text-sm font-bold text-slate-900">Budget vs Spent by Project</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={projectData}
                layout="vertical"
                margin={{ top: 0, right: 20, bottom: 0, left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={formatMillions} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={60} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
                <Bar dataKey="totalCost" name="Spent" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Line */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Total Monthly Expenditure Trend</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={monthlyData.map((d) => ({
                month: d.month,
                total: d.fuel + d.materials + d.maintenance + d.labor + d.other,
              }))}
              margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickFormatter={formatMillions} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line
                type="monotone"
                dataKey="total"
                name="Total Expenditure"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ fill: '#0284c7', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
