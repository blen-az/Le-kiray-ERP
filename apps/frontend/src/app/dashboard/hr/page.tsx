'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Briefcase,
  Building2,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  AlertCircle,
  FileCheck2,
  CalendarCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { EmployeeStatusBadge } from '@/components/hr/EmployeeStatusBadge';
import { AttendanceStatusBadge } from '@/components/hr/AttendanceStatusBadge';
import { LeaveStatusBadge } from '@/components/hr/LeaveStatusBadge';

interface HrKpis {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  overtimeHoursThisWeek: number;
  pendingLeaveRequests: number;
}

interface RecentAttendance {
  id: string;
  attendanceDate: string;
  status: string;
  regularHours: number;
  overtimeHours: number;
  notes?: string;
  employee?: { firstName: string; lastName: string; position: string; employeeCode?: string };
  project?: { projectName: string };
  site?: { siteName: string };
}

interface PendingLeave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  employee?: { firstName: string; lastName: string; position: string };
}

export default function HrDashboardPage() {
  const [kpis, setKpis] = useState<HrKpis>({
    totalEmployees: 11,
    activeEmployees: 10,
    onLeaveEmployees: 1,
    presentToday: 5,
    absentToday: 1,
    lateToday: 1,
    overtimeHoursThisWeek: 16,
    pendingLeaveRequests: 1,
  });

  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([
    {
      id: 'att-1',
      attendanceDate: new Date().toISOString(),
      status: 'Present',
      regularHours: 8,
      overtimeHours: 2,
      employee: { firstName: 'Abebe', lastName: 'Kebede', position: 'Machine Operator', employeeCode: 'EMP-001' },
      project: { projectName: 'Bole Road Expansion' },
      site: { siteName: 'Olympia Junction Site' },
    },
    {
      id: 'att-2',
      attendanceDate: new Date().toISOString(),
      status: 'Late',
      regularHours: 7,
      overtimeHours: 0,
      notes: 'Traffic delay at Megena',
      employee: { firstName: 'Dawit', lastName: 'Tesfaye', position: 'Driver', employeeCode: 'EMP-003' },
      project: { projectName: 'Bole Road Expansion' },
      site: { siteName: 'Olympia Junction Site' },
    },
    {
      id: 'att-3',
      attendanceDate: new Date().toISOString(),
      status: 'Absent',
      regularHours: 0,
      overtimeHours: 0,
      notes: 'Unannounced absence',
      employee: { firstName: 'Tariku', lastName: 'Mengistu', position: 'Machine Operator', employeeCode: 'EMP-011' },
      project: { projectName: 'Hawassa Housing Project' },
      site: { siteName: 'Hawassa Lake Side site' },
    },
  ]);

  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([
    {
      id: 'l-1',
      leaveType: 'Annual Leave',
      startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
      totalDays: 7,
      reason: 'Family vacation and annual holiday leave.',
      employee: { firstName: 'Abebe', lastName: 'Kebede', position: 'Machine Operator' },
    },
  ]);

  const [loading, setLoading] = useState(true);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadHrSummary() {
      if (useMockData) {
        setLoading(false);
        return;
      }

      try {
        const [sumRes, attRes, leaveRes] = await Promise.all([
          fetch(`${apiUrl}/hr/reports/summary`),
          fetch(`${apiUrl}/hr/attendance`),
          fetch(`${apiUrl}/hr/leave-requests?status=Pending`),
        ]);

        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setKpis(sumData.kpis);
        }
        if (attRes.ok) {
          const attData = await attRes.json();
          setRecentAttendance(attData.slice(0, 5));
        }
        if (leaveRes.ok) {
          const leaveData = await leaveRes.json();
          setPendingLeaves(leaveData);
        }
      } catch (err) {
        console.error('Error fetching HR summary:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHrSummary();
  }, [apiUrl, useMockData]);

  if (loading) return <LoadingState message="Loading HR & Site Workforce Analytics..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">HR & Workforce Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track Ethiopian site workers, machinery operators, daily check-ins, overtime, and leave requests.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/hr/employees/new"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <UserPlus size={14} />
            New Employee
          </Link>
          <Link
            href="/dashboard/hr/assignments/new"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <Briefcase size={14} />
            Assign Worker
          </Link>
          <Link
            href="/dashboard/hr/attendance/new"
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <CalendarCheck size={14} />
            Record Attendance
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Workforce</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{kpis.totalEmployees} Employees</div>
              <span className="text-[10px] text-emerald-600 font-semibold">{kpis.activeEmployees} Active on roster</span>
            </div>
            <div className="p-3 bg-sky-50 text-[#0284c7] rounded-lg">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present Today</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{kpis.presentToday} Present</div>
              <span className="text-[10px] text-rose-500 font-semibold">{kpis.absentToday} Absent • {kpis.lateToday} Late</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserCheck size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overtime (This Week)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{kpis.overtimeHoursThisWeek} Hours</div>
              <span className="text-[10px] text-slate-500 font-medium">Logged across site projects</span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Leave</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{kpis.pendingLeaveRequests} Requests</div>
              <Link href="/dashboard/hr/leave" className="text-[10px] text-[#0284c7] font-semibold hover:underline">
                Review Requests →
              </Link>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Calendar size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Attendance & Pending Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance */}
        <Card className="lg:col-span-2 border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Recent Site Check-ins</CardTitle>
              <CardDescription className="text-xs text-slate-500">Live attendance status reported from project sites today.</CardDescription>
            </div>
            <Link href="/dashboard/hr/attendance" className="text-xs font-bold text-[#0284c7] hover:underline">
              View Full Register →
            </Link>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            <div className="divide-y divide-slate-100">
              {recentAttendance.map((a) => (
                <div key={a.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">
                        {a.employee?.firstName} {a.employee?.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">({a.employee?.employeeCode})</span>
                      <AttendanceStatusBadge status={a.status} />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {a.employee?.position} • {a.project?.projectName} ({a.site?.siteName})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 block">{a.regularHours}h Reg {a.overtimeHours > 0 ? `+ ${a.overtimeHours}h OT` : ''}</span>
                    <span className="text-[10px] text-slate-400 block">{new Date(a.attendanceDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Leave Requests */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">Pending Leave Approvals</CardTitle>
            <Link href="/dashboard/hr/leave" className="text-xs font-bold text-[#0284c7] hover:underline">
              Directory →
            </Link>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            {pendingLeaves.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No pending leave requests.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingLeaves.map((l) => (
                  <div key={l.id} className="p-3.5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {l.employee?.firstName} {l.employee?.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400">{l.employee?.position}</span>
                      </div>
                      <LeaveStatusBadge status="Pending" />
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-700">
                      <span className="font-bold">{l.leaveType}</span> ({l.totalDays} days)
                      <p className="text-[10px] text-slate-500 mt-0.5">{l.reason}</p>
                    </div>
                    <Link
                      href={`/dashboard/hr/leave/${l.id}`}
                      className="text-xs font-bold text-[#0284c7] hover:underline block text-right"
                    >
                      Review & Approve →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
