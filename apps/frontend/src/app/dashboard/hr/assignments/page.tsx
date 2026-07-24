'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Plus, Search, Filter, ArrowLeft, Building2, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';

interface AssignmentItem {
  id: string;
  positionOnSite?: string;
  startDate: string;
  endDate?: string;
  status: string;
  notes?: string;
  employee?: { id: string; firstName: string; lastName: string; position: string; employeeCode?: string };
  project?: { id: string; projectName: string };
  site?: { id: string; siteName: string };
  assignedBy?: { firstName: string; lastName: string };
}

const fallbackAssignments: AssignmentItem[] = [
  {
    id: 'asg-1',
    positionOnSite: 'Senior Machine Operator',
    startDate: '2024-01-01',
    status: 'Active',
    employee: { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede', position: 'Machine Operator', employeeCode: 'EMP-001' },
    project: { id: 'p-1', projectName: 'Bole Road Expansion' },
    site: { id: 's-1', siteName: 'Olympia Junction Site' },
    assignedBy: { firstName: 'Kidist', lastName: 'Haile' },
  },
  {
    id: 'asg-2',
    positionOnSite: 'Site Manager',
    startDate: '2024-01-01',
    status: 'Active',
    employee: { id: 'e-2', firstName: 'Mekdes', lastName: 'Alemu', position: 'Site Manager', employeeCode: 'EMP-002' },
    project: { id: 'p-1', projectName: 'Bole Road Expansion' },
    site: { id: 's-1', siteName: 'Olympia Junction Site' },
    assignedBy: { firstName: 'Kidist', lastName: 'Haile' },
  },
  {
    id: 'asg-3',
    positionOnSite: 'Lead Mason',
    startDate: '2024-01-01',
    status: 'Active',
    employee: { id: 'e-9', firstName: 'Hana', lastName: 'Tola', position: 'Mason', employeeCode: 'EMP-009' },
    project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
    site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
    assignedBy: { firstName: 'Kidist', lastName: 'Haile' },
  },
];

export default function EmployeeAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(fallbackAssignments);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function fetchAssignments() {
      if (useMockData) {
        setAssignments(fallbackAssignments);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/hr/assignments`);
        if (res.ok) {
          const data = await res.json();
          setAssignments(data);
        } else {
          setAssignments(fallbackAssignments);
        }
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setAssignments(fallbackAssignments);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, [apiUrl, useMockData]);

  const filtered = assignments.filter((a) => {
    const empName = `${a.employee?.firstName} ${a.employee?.lastName}`.toLowerCase();
    const matchesSearch =
      empName.includes(search.toLowerCase()) ||
      (a.project?.projectName && a.project.projectName.toLowerCase().includes(search.toLowerCase())) ||
      (a.site?.siteName && a.site.siteName.toLowerCase().includes(search.toLowerCase())) ||
      (a.positionOnSite && a.positionOnSite.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading site employee assignment register..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/hr" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Project Site Assignments</h2>
            <p className="text-xs text-slate-500">Employee site deployments, assigned roles, and deployment dates.</p>
          </div>
        </div>

        <Link
          href="/dashboard/hr/assignments/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          New Site Assignment
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
                placeholder="Search employee, project contract, site plot..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Assignment Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Transferred">Transferred</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-md">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Position on Site</th>
                  <th className="py-3 px-4">Project Contract</th>
                  <th className="py-3 px-4">Site Plot</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Assigned By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No assignment records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : 'Employee'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {a.positionOnSite || a.employee?.position}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {a.project?.projectName}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {a.site?.siteName}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(a.startDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Ongoing'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {a.assignedBy ? `${a.assignedBy.firstName} ${a.assignedBy.lastName}` : 'HR Manager'}
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
