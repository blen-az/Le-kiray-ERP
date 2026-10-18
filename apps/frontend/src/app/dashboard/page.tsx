'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Wrench,
  Fuel,
  Users,
  AlertTriangle,
  FileText,
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { apiFetch } from '@/lib/api';

// Types matching the Backend API payload
interface CeoStats {
  kpis: {
    activeProjects: number;
    machineryUtilization: {
      rate: number;
      active: number;
      idle: number;
      maintenance: number;
      total: number;
    };
    monthlyFuelCost: number;
    monthlyMaintenanceCost: number;
    totalMonthlyCost: number;
    attendanceToday: {
      present: number;
      total: number;
    };
    lowStockAlertsCount: number;
    totalStockValue?: number;
    outOfStockCount?: number;
    pendingMaterialRequestsCount?: number;
    topConsumedItem?: string;
  };
  lowStockItems: Array<{
    id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    minStockAlert: number;
    warehouse: { name: string };
  }>;
  recentReports: Array<{
    id: string;
    date: string;
    workCompleted: string;
    workersPresent: number;
    issuesBlockers?: string | null;
    project: { name: string };
    site: { name: string };
    submittedBy: { firstName: string; lastName: string };
  }>;
  projectsAtRisk: Array<{
    id: string;
    projectName: string;
    siteName: string;
    issue: string;
    date: string;
  }>;
  activeMaintenance: Array<{
    id: string;
    description: string;
    cost: number;
    machine: { name: string; plateNumber: string };
  }>;
  marketplaceRequestsCount: number;
}

// Seed data fallback
const fallbackData: CeoStats = {
  kpis: {
    activeProjects: 2,
    machineryUtilization: {
      rate: 60,
      active: 3,
      idle: 1,
      maintenance: 1,
      total: 5,
    },
    monthlyFuelCost: 38675.0,
    monthlyMaintenanceCost: 45000.0,
    totalMonthlyCost: 83675.0,
    attendanceToday: {
      present: 2,
      total: 2,
    },
    lowStockAlertsCount: 2,
    totalStockValue: 12845000.0,
    outOfStockCount: 1,
    pendingMaterialRequestsCount: 2,
    topConsumedItem: 'Cement 50kg (200 Bags)',
  },
  lowStockItems: [
    {
      id: 'inv-item-5',
      name: 'Electric Cable',
      category: 'CABLE',
      unit: 'ROLLS',
      quantity: 8,
      minStockAlert: 10,
      warehouse: { name: 'Bole Central Store' },
    },
  ],
  recentReports: [
    {
      id: 'rep-1',
      date: new Date().toISOString(),
      workCompleted: 'Excavated 150m trench line. Laid base course level from chainage 1+200 to 1+350. Completed asphalt edge cutting.',
      workersPresent: 18,
      issuesBlockers: 'High congestion at Olympia intersection delayed dump truck return loops. Rain started around 4:30 PM, causing early site closure.',
      project: { name: 'Bole Road Expansion' },
      site: { name: 'Olympia Junction Site' },
      submittedBy: { firstName: 'Almaz', lastName: 'Desta' },
    },
  ],
  projectsAtRisk: [
    {
      id: 'proj-1',
      projectName: 'Bole Road Expansion',
      siteName: 'Olympia Junction Site',
      issue: 'High congestion at Olympia intersection delayed dump truck return loops. Rain started around 4:30 PM.',
      date: new Date().toISOString(),
    },
  ],
  activeMaintenance: [
    {
      id: 'maint-1',
      description: 'Hydraulic cylinder resealing and oil change.',
      cost: 45000.0,
      machine: { name: 'CAT 140H Grader', plateNumber: 'ET-3-A0101' },
    },
  ],
  marketplaceRequestsCount: 2,
};

const PIE_COLORS = ['#0284c7', '#64748b', '#f59e0b'];

export default function CeoDashboard() {
  const [data, setData] = useState<CeoStats>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    async function fetchData() {
      if (useMockData) {
        setData(fallbackData);
        setUsingMock(true);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/dashboard/ceo`);
        if (!res.ok) throw new Error('Failed to load dashboard data from API');
        const json = await res.json();
        setData(json);
        setUsingMock(false);
        setError(null);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Could not connect to ERP server');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg max-w-2xl mx-auto my-12 shadow-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-rose-600 animate-bounce" size={20} />
          <h3 className="font-bold text-sm text-rose-900">ERP Server Connection Error</h3>
        </div>
        <p className="text-xs mt-2 leading-relaxed text-rose-700">{error}</p>
        <p className="text-xs mt-3 text-slate-500 border-t border-rose-200/50 pt-2 font-medium">
          Verify that the NestJS backend application is running at <code>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}</code> and your database connection is active. 
          Alternatively, you can enable mock mode in development by adding <code>NEXT_PUBLIC_USE_MOCK_DATA=true</code> to your <code>.env</code> file.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-500 font-medium">Loading ERP dashboard analytics...</span>
        </div>
      </div>
    );
  }

  // Formatting chart data
  const costBreakdownData = [
    { name: 'Fuel Usage', cost: data.kpis.monthlyFuelCost },
    { name: 'Maintenance', cost: data.kpis.monthlyMaintenanceCost },
    { name: 'Equipment Rental', cost: 24000.0 }, // Static mock value representing rented trucks
  ];

  const machinePieData = [
    { name: 'Active', value: data.kpis.machineryUtilization.active },
    { name: 'Idle', value: data.kpis.machineryUtilization.idle },
    { name: 'Under Repair', value: data.kpis.machineryUtilization.maintenance },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner and Feedback */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Owner & CEO Dashboard</h2>
          <p className="text-slate-500 text-sm">Real-time status overview of project sites, machinery fleet, fuel logs, and materials in Ethiopia.</p>
        </div>

        {usingMock && (
          <Badge variant="warning" className="animate-pulse py-1 px-3">
            Offline Mode: Showing seeded sample data
          </Badge>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Projects */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Sites</CardTitle>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-md">
              <Building2 size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.activeProjects} Projects</div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Sites actively reporting today
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Machinery Utilization */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Machinery Utilization</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
              <Wrench size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.machineryUtilization.rate}%</div>
            <p className="text-[10px] text-slate-400 mt-1">
              {data.kpis.machineryUtilization.active} of {data.kpis.machineryUtilization.total} machines deployed on sites
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Total Monthly Cost */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Monthly Cost</CardTitle>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-md">
              <Fuel size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.kpis.totalMonthlyCost)}</div>
            <p className="text-[10px] text-rose-500 mt-1 flex items-center font-medium">
              <TrendingUp size={12} className="mr-1" />
              Fuel: {formatCurrency(data.kpis.monthlyFuelCost)}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Headcount */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Staff On-Site Today</CardTitle>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
              <Users size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.kpis.attendanceToday.present} / {data.kpis.attendanceToday.total}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {Math.round((data.kpis.attendanceToday.present / data.kpis.attendanceToday.total) * 100)}% attendance rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Executive Summary Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 text-white border-none">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Inventory Value</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {formatCurrency(data.kpis.totalStockValue || 12845000)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Stored Assets & Materials</span>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Low / Out-of-Stock Items</span>
            <div className="text-xl font-black text-amber-600 mt-1">
              {data.kpis.lowStockAlertsCount} Alert Items
            </div>
            <Link href="/dashboard/inventory/reports" className="text-[10px] text-[#0284c7] font-semibold hover:underline block mt-1">
              View Re-order Report →
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Material Requests</span>
            <div className="text-xl font-black text-[#0284c7] mt-1">
              {data.kpis.pendingMaterialRequestsCount || 2} Requests
            </div>
            <Link href="/dashboard/inventory/requests" className="text-[10px] text-[#0284c7] font-semibold hover:underline block mt-1">
              Review Site Requests →
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Top Consumed Item</span>
            <div className="text-sm font-bold text-slate-900 mt-1 truncate">
              {data.kpis.topConsumedItem || 'Cement 50kg (200 Bags)'}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Bole & Hawassa Sites</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Cost Breakdown Chart (Left 2 columns) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-800">Operational Expenses Breakdown (Current Month)</CardTitle>
            <CardDescription>Visual distribution of fuel, maintenance, and heavy machinery rental costs.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tickFormatter={(val) => `${val / 1000}k`} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip formatter={(value: any) => [`${formatCurrency(Number(value))}`, 'Cost']} />
                <Bar dataKey="cost" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={45}>
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0284c7' : index === 1 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Machinery Status Donut (Right 1 column) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-800">Machinery Deployment Status</CardTitle>
            <CardDescription>Distribution of active, idle, and servicing equipment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={machinePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {machinePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Machines`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex gap-4 text-xs font-semibold text-slate-600 mt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span> Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></span> Idle
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> Service
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Reports & Health Indicators */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Daily Reports Feed (Left 2 columns) */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">Daily Site Reports Summary</CardTitle>
              <CardDescription>Recent site activities submitted by construction site managers.</CardDescription>
            </div>
            <Link href="/dashboard/reports/daily-site">
              <button className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-semibold">
                View all reports <ArrowUpRight size={14} />
              </button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText size={40} className="mb-2 stroke-1" />
                <span className="text-xs">No daily site reports submitted today yet.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentReports.map((report) => (
                  <div key={report.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 bg-slate-200 px-2.5 py-0.5 rounded-md">
                          {report.project.name}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <MapPin size={12} className="text-sky-500" /> {report.site.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock size={12} /> {formatDate(report.date)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      {report.workCompleted}
                    </p>

                    {report.issuesBlockers && (
                      <div className="flex items-start gap-1.5 bg-rose-50 border border-rose-200 p-2.5 rounded text-xs text-rose-800">
                        <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-rose-900 block">Logged Blocker:</strong>
                          {report.issuesBlockers}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60 pt-2 font-medium">
                      <span>Workers present: {report.workersPresent}</span>
                      <span>Submitted by: {report.submittedBy.firstName} {report.submittedBy.lastName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Critical Status Checklists (Right 1 column) */}
        <div className="space-y-6">
          {/* Low Stock Indicators */}
          <Card className="border-rose-100 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-800">
                <AlertTriangle size={16} className="text-rose-500 animate-bounce" />
                Critical Inventory Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {data.lowStockItems.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">
                  No materials below warning levels.
                </div>
              ) : (
                data.lowStockItems.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <Badge variant="destructive" className="text-[9px] py-0 px-1.5 font-bold">
                        LOW STOCK
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-500">Warehouse: {item.warehouse.name}</span>
                    <div className="flex justify-between items-center text-[10px] text-slate-600 mt-1 border-t border-slate-200/50 pt-1">
                      <span>Available: <strong>{item.quantity} {item.unit}</strong></span>
                      <span>Minimum Alert: <strong>{item.minStockAlert} {item.unit}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Maintenance */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <Wrench size={16} className="text-sky-500" />
                Equipment Maintenance
              </CardTitle>
              <Link href="/dashboard/maintenance" className="text-xs text-[#0284c7] font-semibold hover:underline">
                View All →
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {data.activeMaintenance.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">
                  No machines currently in workshop.
                </div>
              ) : (
                data.activeMaintenance.map((record) => (
                  <div key={record.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800">{record.machine.name}</span>
                      <Badge variant="warning" className="text-[9px] py-0 px-1.5">REPAIR</Badge>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Plate: {record.machine.plateNumber}</span>
                    <p className="text-[11px] text-slate-600 my-1">{record.description}</p>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1 pt-1 border-t border-slate-200/50">
                      Estimated Cost: {formatCurrency(record.cost)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Marketplace Integration request */}
          <Card className="bg-[#0f172a] text-slate-100 border-[#1e293b]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-sky-400">
                Le’Kiray Marketplace
              </CardTitle>
              <CardDescription className="text-slate-400 text-[11px]">Rent external machinery from our trusted partners.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs">
              <div className="p-3 bg-[#1e293b]/50 border border-slate-700/40 rounded-md">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-slate-200">2 Active Marketplace requests</span>
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mb-2">
                  Need an extra excavator or concrete mixer? Source heavy machinery directly from marketplace owners in Addis.
                </p>
                <button className="w-full py-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white text-[10px] font-bold rounded transition-colors uppercase tracking-wider">
                  Browse Rental Fleet
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
