'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertTriangle,
  Wrench,
  Plus,
  Eye,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { MaintenanceStatusBadge } from '@/components/maintenance/MaintenanceStatusBadge';
import { MaintenancePriorityBadge } from '@/components/maintenance/MaintenancePriorityBadge';
import { MaintenanceTypeBadge } from '@/components/maintenance/MaintenanceTypeBadge';
import { apiFetch } from '@/lib/api';

interface ScheduleSummary {
  totalScheduled: number;
  overdueCount: number;
  dueRemindersCount: number;
  records: Array<{
    id: string;
    issueTitle: string;
    maintenanceType: string;
    status: string;
    priority: string;
    scheduledDate?: string;
    nextServiceDate?: string;
    machine?: { id: string; brand: string; model: string; plateNumber?: string };
    project?: { id: string; projectName: string };
    site?: { id: string; siteName: string };
    assignedMechanic?: { id: string; firstName: string; lastName: string };
  }>;
  overdueRecords: any[];
  reminders: any[];
}

const fallbackSchedule: ScheduleSummary = {
  totalScheduled: 2,
  overdueCount: 1,
  dueRemindersCount: 1,
  records: [
    {
      id: 'maint-1',
      issueTitle: 'Hydraulic Cylinder Oil Leak',
      maintenanceType: 'Breakdown Repair',
      status: 'In Progress',
      priority: 'Urgent',
      scheduledDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      nextServiceDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      machine: { id: 'm-1', brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234' },
      project: { id: 'p-1', projectName: 'Bole Road Expansion' },
      site: { id: 's-1', siteName: 'Olympia Junction Site' },
      assignedMechanic: { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede' },
    },
    {
      id: 'maint-2',
      issueTitle: '500-Hour Scheduled Interval Service',
      maintenanceType: 'Preventive Maintenance',
      status: 'Scheduled',
      priority: 'Normal',
      scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      nextServiceDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      machine: { id: 'm-2', brand: 'Volvo', model: 'L90 Loader', plateNumber: 'ET-3-B5678' },
      project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
      site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
      assignedMechanic: { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede' },
    },
  ],
  overdueRecords: [],
  reminders: [],
};

export default function MaintenanceSchedulePage() {
  const [data, setData] = useState<ScheduleSummary>(fallbackSchedule);
  const [loading, setLoading] = useState(true);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadSchedule() {
      if (useMockData) {
        setData(fallbackSchedule);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/maintenance/schedule/upcoming`);
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Error loading maintenance schedule:', err);
        setData(fallbackSchedule);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [apiUrl, useMockData]);

  if (loading) return <LoadingState message="Fetching equipment maintenance schedules & overdue service reminders..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/maintenance" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Maintenance Schedule & Reminders</h2>
            <p className="text-xs text-slate-500">Scheduled preventive services, overdue maintenance alerts, and next service interval reminders.</p>
          </div>
        </div>

        <Link
          href="/dashboard/maintenance/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          Schedule Maintenance
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-100 shadow-xs p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Maintenance</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{data.totalScheduled} Records</div>
            <span className="text-[10px] text-sky-600 font-semibold">Active & Upcoming</span>
          </div>
          <div className="p-3 bg-sky-50 text-[#0284c7] rounded-lg">
            <Calendar size={22} />
          </div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Maintenance</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{data.overdueCount} Overdue</div>
            <span className="text-[10px] text-rose-500 font-semibold">Immediate action required</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <ShieldAlert size={22} />
          </div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Service Reminders</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{data.dueRemindersCount} Reminders</div>
            <span className="text-[10px] text-amber-700 font-semibold">Interval service due</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={22} />
          </div>
        </Card>
      </div>

      {/* Schedule Table */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Upcoming & Overdue Service Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Machine Asset</th>
                  <th className="py-3 px-4">Project & Site</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Issue / Title</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Next Service Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No maintenance schedules found.
                    </td>
                  </tr>
                ) : (
                  data.records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : 'Unscheduled'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{r.machine ? `${r.machine.brand} ${r.machine.model}` : 'Machine'}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">{r.machine?.plateNumber || ''}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{r.project?.projectName || 'Unassigned'}</span>
                        <span className="text-[10px] text-slate-500 block">{r.site?.siteName || 'Depot'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <MaintenanceTypeBadge type={r.maintenanceType} />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.issueTitle}</td>
                      <td className="py-3 px-4 text-center">
                        <MaintenancePriorityBadge priority={r.priority} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <MaintenanceStatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {r.nextServiceDate ? new Date(r.nextServiceDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/maintenance/${r.id}`}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs transition-colors"
                        >
                          View Details →
                        </Link>
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
