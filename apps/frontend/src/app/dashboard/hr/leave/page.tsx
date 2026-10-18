'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Plus, Search, Filter, ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { LeaveStatusBadge } from '@/components/hr/LeaveStatusBadge';
import { apiFetch } from '@/lib/api';

interface LeaveRequestItem {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason?: string;
  employee?: { id: string; firstName: string; lastName: string; position: string; employeeCode?: string };
  approvedBy?: { firstName: string; lastName: string };
}

const fallbackLeaves: LeaveRequestItem[] = [
  {
    id: 'l-1',
    leaveType: 'Annual Leave',
    startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    totalDays: 7,
    status: 'Pending',
    reason: 'Family vacation and annual holiday leave.',
    employee: { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede', position: 'Machine Operator', employeeCode: 'EMP-001' },
  },
  {
    id: 'l-2',
    leaveType: 'Sick Leave',
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    totalDays: 4,
    status: 'Approved',
    reason: 'Doctor prescribed bed rest following flu.',
    employee: { id: 'e-10', firstName: 'Tigist', lastName: 'Worku', position: 'Electrician', employeeCode: 'EMP-010' },
    approvedBy: { firstName: 'Kidist', lastName: 'Haile' },
  },
  {
    id: 'l-3',
    leaveType: 'Emergency Leave',
    startDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 8 * 86400000).toISOString(),
    totalDays: 2,
    status: 'Rejected',
    reason: 'Personal errand',
    employee: { id: 'e-3', firstName: 'Dawit', lastName: 'Tesfaye', position: 'Driver', employeeCode: 'EMP-003' },
    approvedBy: { firstName: 'Kidist', lastName: 'Haile' },
  },
];

export default function LeaveRequestsPage() {
  const [leaves, setLeaves] = useState<LeaveRequestItem[]>(fallbackLeaves);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function fetchLeaves() {
      if (useMockData) {
        setLeaves(fallbackLeaves);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/hr/leave-requests`);
        if (res.ok) {
          const data = await res.json();
          setLeaves(data);
        } else {
          setLeaves(fallbackLeaves);
        }
      } catch (err) {
        console.error('Error fetching leave requests:', err);
        setLeaves(fallbackLeaves);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaves();
  }, [apiUrl, useMockData]);

  const filtered = leaves.filter((l) => {
    const empName = `${l.employee?.firstName} ${l.employee?.lastName}`.toLowerCase();
    const matchesSearch =
      empName.includes(search.toLowerCase()) ||
      (l.leaveType && l.leaveType.toLowerCase().includes(search.toLowerCase())) ||
      (l.reason && l.reason.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || l.leaveType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) return <LoadingState message="Loading employee leave requests..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/hr" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Leave Requests & Absences</h2>
            <p className="text-xs text-slate-500">Employee leave applications, approvals, and absence records.</p>
          </div>
        </div>

        <Link
          href="/dashboard/hr/leave/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          Submit Leave Request
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
                placeholder="Search employee name, leave type, or reason..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Leave Types</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Paternity Leave">Paternity Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Permission">Permission</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-md">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4 text-right">Total Days</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Employee'}
                        <span className="text-[10px] font-mono text-slate-400 block">{l.employee?.position}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{l.leaveType}</td>
                      <td className="py-3 px-4">{new Date(l.startDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">{l.totalDays}</td>
                      <td className="py-3 px-4 text-center">
                        <LeaveStatusBadge status={l.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate">{l.reason || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/hr/leave/${l.id}`}
                          className="text-[#0284c7] hover:underline font-bold text-xs"
                        >
                          View / Review →
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
