'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Eye,
  Edit3,
  TrendingUp,
  Play,
  CheckSquare,
  ShieldAlert,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { MaintenanceStatusBadge } from '@/components/maintenance/MaintenanceStatusBadge';
import { MaintenancePriorityBadge } from '@/components/maintenance/MaintenancePriorityBadge';
import { MaintenanceTypeBadge } from '@/components/maintenance/MaintenanceTypeBadge';
import { formatCurrency } from '@/lib/utils';

interface MaintenanceRecordItem {
  id: string;
  reportedDate: string;
  scheduledDate?: string;
  completedAt?: string;
  nextServiceDate?: string;
  maintenanceType: string;
  status: string;
  priority: string;
  issueTitle: string;
  totalCost: number;
  downtimeHours: number;
  machine?: { id: string; brand: string; model: string; plateNumber?: string; machineType?: string };
  project?: { id: string; projectName: string; projectCode?: string };
  site?: { id: string; siteName: string; location?: string };
  assignedMechanic?: { id: string; firstName: string; lastName: string; position?: string };
}

interface SummaryKpis {
  totalRecords: number;
  completedCount: number;
  openIssuesCount: number;
  urgentCount: number;
  totalMaintenanceCost: number;
  totalDowntimeHours: number;
}

const fallbackRecords: MaintenanceRecordItem[] = [
  {
    id: 'maint-1',
    reportedDate: new Date(Date.now() - 86400000).toISOString(),
    scheduledDate: new Date(Date.now() - 86400000).toISOString(),
    maintenanceType: 'Breakdown Repair',
    status: 'In Progress',
    priority: 'Urgent',
    issueTitle: 'Hydraulic Cylinder Oil Leak',
    totalCost: 18000,
    downtimeHours: 5.5,
    machine: { id: 'm-1', brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234', machineType: 'Excavator' },
    project: { id: 'p-1', projectName: 'Bole Road Expansion' },
    site: { id: 's-1', siteName: 'Olympia Junction Site' },
    assignedMechanic: { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede', position: 'Senior Mechanic' },
  },
  {
    id: 'maint-2',
    reportedDate: new Date().toISOString(),
    scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    maintenanceType: 'Preventive Maintenance',
    status: 'Scheduled',
    priority: 'Normal',
    issueTitle: '500-Hour Scheduled Interval Service',
    totalCost: 10500,
    downtimeHours: 0,
    machine: { id: 'm-2', brand: 'Volvo', model: 'L90 Loader', plateNumber: 'ET-3-B5678', machineType: 'Loader' },
    project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
    site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
    assignedMechanic: { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede' },
  },
  {
    id: 'maint-3',
    reportedDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    maintenanceType: 'Tire Service',
    status: 'Completed',
    priority: 'High',
    issueTitle: 'Rear Axle Dual Tire Puncture & Replacement',
    totalCost: 25500,
    downtimeHours: 3.0,
    machine: { id: 'm-3', brand: 'Sinotruk', model: 'Howo Dump Truck', plateNumber: 'ET-3-C9988', machineType: 'Dump Truck' },
    project: { id: 'p-1', projectName: 'Bole Road Expansion' },
    site: { id: 's-2', siteName: 'Rwanda Traffic Circle Site' },
    assignedMechanic: { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede' },
  },
];

export default function MaintenanceDashboardPage() {
  const [records, setRecords] = useState<MaintenanceRecordItem[]>(fallbackRecords);
  const [kpis, setKpis] = useState<SummaryKpis>({
    totalRecords: 3,
    completedCount: 1,
    openIssuesCount: 2,
    urgentCount: 1,
    totalMaintenanceCost: 54000,
    totalDowntimeHours: 8.5,
  });

  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadDashboardData() {
      if (useMockData) {
        setRecords(fallbackRecords);
        setLoading(false);
        return;
      }

      try {
        const [recRes, sumRes] = await Promise.all([
          fetch(`${apiUrl}/maintenance`),
          fetch(`${apiUrl}/maintenance/reports/summary`),
        ]);

        if (recRes.ok) setRecords(await recRes.json());
        if (sumRes.ok) setKpis(await sumRes.json());
      } catch (err) {
        console.error('Error loading maintenance dashboard:', err);
        setRecords(fallbackRecords);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [apiUrl, useMockData]);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.issueTitle.toLowerCase().includes(search.toLowerCase()) ||
      (r.machine && `${r.machine.brand} ${r.machine.model}`.toLowerCase().includes(search.toLowerCase())) ||
      (r.project?.projectName && r.project.projectName.toLowerCase().includes(search.toLowerCase())) ||
      (r.site?.siteName && r.site.siteName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || r.priority === priorityFilter;
    const matchesType = typeFilter === 'ALL' || r.maintenanceType === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  if (loading) return <LoadingState message="Loading heavy machinery maintenance dashboard & cost metrics..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Machinery Maintenance Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track fleet breakdowns, preventive service, mechanics, spare parts, downtime, and repair costs.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/maintenance/schedule"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <Calendar size={14} />
            Service Schedule
          </Link>
          <Link
            href="/dashboard/maintenance/reports"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <TrendingUp size={14} />
            Cost & Downtime Analytics
          </Link>
          <Link
            href="/dashboard/maintenance/new"
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-xs transition-colors"
          >
            <Plus size={15} />
            New Maintenance Record
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Records</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{kpis.totalRecords} Logs</div>
              <span className="text-[10px] text-slate-500 font-medium">Logged this month</span>
            </div>
            <div className="p-3 bg-sky-50 text-[#0284c7] rounded-lg">
              <Wrench size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Issues</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{kpis.openIssuesCount} Active</div>
              <span className="text-[10px] text-amber-700 font-semibold">Reported/In Progress</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Urgent / Critical</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{kpis.urgentCount} High Risk</div>
              <span className="text-[10px] text-rose-500 font-semibold">Breakdown alerts</span>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Repairs</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{kpis.completedCount} Fixed</div>
              <span className="text-[10px] text-emerald-600 font-semibold">Resolved this month</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Maintenance Cost</span>
              <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(kpis.totalMaintenanceCost)}</div>
              <span className="text-[10px] text-slate-500 font-medium">Parts, labor & service</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Machine Downtime</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{kpis.totalDowntimeHours} Hours</div>
              <span className="text-[10px] text-slate-500 font-medium">Lost operational hours</span>
            </div>
            <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Directory Table */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Maintenance Records Directory</CardTitle>
          <CardDescription className="text-xs text-slate-500">List of all reported, scheduled, and completed equipment repairs across project sites.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issue title, machine brand/model, plate number, project..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Maintenance Types</option>
              <option value="Breakdown Repair">Breakdown Repair</option>
              <option value="Preventive Maintenance">Preventive Maintenance</option>
              <option value="Corrective Maintenance">Corrective Maintenance</option>
              <option value="Oil Change">Oil Change</option>
              <option value="Tire Service">Tire Service</option>
              <option value="Hydraulic Service">Hydraulic Service</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-md text-xs">
            <table className="w-full text-left text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Reported Date</th>
                  <th className="py-3 px-4">Machine Asset</th>
                  <th className="py-3 px-4">Project & Site</th>
                  <th className="py-3 px-4">Maintenance Type</th>
                  <th className="py-3 px-4">Issue Title</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Mechanic</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                      No maintenance records matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {new Date(m.reportedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {m.machine ? `${m.machine.brand} ${m.machine.model}` : 'Machine'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {m.machine?.plateNumber || 'No Plate'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{m.project?.projectName || 'Unassigned'}</span>
                        <span className="text-[10px] text-slate-500 block">{m.site?.siteName || 'Depot'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <MaintenanceTypeBadge type={m.maintenanceType} />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate" title={m.issueTitle}>
                        {m.issueTitle}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <MaintenancePriorityBadge priority={m.priority} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <MaintenanceStatusBadge status={m.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {m.assignedMechanic ? `${m.assignedMechanic.firstName} ${m.assignedMechanic.lastName}` : 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(m.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/maintenance/${m.id}`}
                            className="p-1 text-slate-400 hover:text-slate-900 rounded"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </Link>
                          {m.status !== 'Completed' && (
                            <Link
                              href={`/dashboard/maintenance/${m.id}/edit`}
                              className="p-1 text-slate-400 hover:text-slate-900 rounded"
                              title="Edit Record"
                            >
                              <Edit3 size={15} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
