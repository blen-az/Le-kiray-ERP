'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Plus, Search, Filter, ArrowLeft, Clock, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { AttendanceStatusBadge } from '@/components/hr/AttendanceStatusBadge';

interface AttendanceRecord {
  id: string;
  attendanceDate: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  regularHours: number;
  overtimeHours: number;
  notes?: string;
  employee?: { id: string; firstName: string; lastName: string; position: string; employeeCode?: string };
  project?: { id: string; projectName: string };
  site?: { id: string; siteName: string };
  recordedBy?: { firstName: string; lastName: string };
}

const fallbackAttendance: AttendanceRecord[] = [
  {
    id: 'att-1',
    attendanceDate: new Date().toISOString(),
    status: 'Present',
    checkInTime: new Date(new Date().setHours(8, 0)).toISOString(),
    checkOutTime: new Date(new Date().setHours(17, 0)).toISOString(),
    regularHours: 8,
    overtimeHours: 2,
    employee: { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede', position: 'Machine Operator', employeeCode: 'EMP-001' },
    project: { id: 'p-1', projectName: 'Bole Road Expansion' },
    site: { id: 's-1', siteName: 'Olympia Junction Site' },
    recordedBy: { firstName: 'Kidist', lastName: 'Haile' },
  },
  {
    id: 'att-2',
    attendanceDate: new Date().toISOString(),
    status: 'Late',
    checkInTime: new Date(new Date().setHours(9, 15)).toISOString(),
    checkOutTime: new Date(new Date().setHours(17, 0)).toISOString(),
    regularHours: 7,
    overtimeHours: 0,
    notes: 'Traffic delay at Megena',
    employee: { id: 'e-3', firstName: 'Dawit', lastName: 'Tesfaye', position: 'Driver', employeeCode: 'EMP-003' },
    project: { id: 'p-1', projectName: 'Bole Road Expansion' },
    site: { id: 's-1', siteName: 'Olympia Junction Site' },
    recordedBy: { firstName: 'Kidist', lastName: 'Haile' },
  },
  {
    id: 'att-3',
    attendanceDate: new Date().toISOString(),
    status: 'Absent',
    regularHours: 0,
    overtimeHours: 0,
    notes: 'Unannounced absence',
    employee: { id: 'e-11', firstName: 'Tariku', lastName: 'Mengistu', position: 'Machine Operator', employeeCode: 'EMP-011' },
    project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
    site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
    recordedBy: { firstName: 'Kidist', lastName: 'Haile' },
  },
  {
    id: 'att-4',
    attendanceDate: new Date().toISOString(),
    status: 'On Leave',
    regularHours: 0,
    overtimeHours: 0,
    notes: 'Approved sick leave',
    employee: { id: 'e-10', firstName: 'Tigist', lastName: 'Worku', position: 'Electrician', employeeCode: 'EMP-010' },
    project: { id: 'p-3', projectName: 'Dire Dawa Water Pipeline' },
    site: { id: 's-4', siteName: 'Ganda Site A' },
    recordedBy: { firstName: 'Kidist', lastName: 'Haile' },
  },
];

export default function DailyAttendanceLogsPage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(fallbackAttendance);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function fetchAttendance() {
      if (useMockData) {
        setAttendance(fallbackAttendance);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/hr/attendance`);
        if (res.ok) {
          const data = await res.json();
          setAttendance(data);
        } else {
          setAttendance(fallbackAttendance);
        }
      } catch (err) {
        console.error('Error fetching attendance logs:', err);
        setAttendance(fallbackAttendance);
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [apiUrl, useMockData]);

  const filtered = attendance.filter((a) => {
    const empName = `${a.employee?.firstName} ${a.employee?.lastName}`.toLowerCase();
    const matchesSearch =
      empName.includes(search.toLowerCase()) ||
      (a.employee?.employeeCode && a.employee.employeeCode.toLowerCase().includes(search.toLowerCase())) ||
      (a.project?.projectName && a.project.projectName.toLowerCase().includes(search.toLowerCase())) ||
      (a.site?.siteName && a.site.siteName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading daily attendance audit register..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/hr" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Daily Attendance Logs</h2>
            <p className="text-xs text-slate-500">Site check-in/out records, status tracking, and overtime hours.</p>
          </div>
        </div>

        <Link
          href="/dashboard/hr/attendance/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          Record Attendance
        </Link>
      </div>

      {/* Filter Card */}
      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee name, code, project or site..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Attendance Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="On Leave">On Leave</option>
              <option value="Half Day">Half Day</option>
              <option value="Sick">Sick</option>
              <option value="Permission">Permission</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-md">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Project & Site</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Check-in / Check-out</th>
                  <th className="py-3 px-4 text-right">Reg Hours</th>
                  <th className="py-3 px-4 text-right">OT Hours</th>
                  <th className="py-3 px-4">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {new Date(a.attendanceDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : 'Employee'}
                        <span className="text-[10px] font-mono text-slate-400 block">{a.employee?.position}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{a.project?.projectName}</span>
                        <span className="text-[10px] text-slate-400 block">{a.site?.siteName}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <AttendanceStatusBadge status={a.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px]">
                        {a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        {' - '}
                        {a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {a.regularHours}h
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-indigo-600">
                        {a.overtimeHours}h
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[150px] truncate">
                        {a.notes || '-'}
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
