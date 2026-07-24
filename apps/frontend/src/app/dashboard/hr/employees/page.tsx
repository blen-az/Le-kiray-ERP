'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Search, Filter, ArrowLeft, Edit3, Eye, Briefcase, Phone, Mail, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { EmployeeStatusBadge } from '@/components/hr/EmployeeStatusBadge';
import { EmploymentTypeBadge } from '@/components/hr/EmploymentTypeBadge';

interface EmployeeItem {
  id: string;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  position: string;
  department?: string;
  employmentType: string;
  employmentStatus: string;
  hireDate?: string;
  site?: { id: string; siteName: string };
  assignments?: Array<{
    id: string;
    positionOnSite?: string;
    project: { id: string; projectName: string };
    site: { id: string; siteName: string };
  }>;
}

const fallbackEmployees: EmployeeItem[] = [
  { id: 'e-1', employeeCode: 'EMP-001', firstName: 'Abebe', lastName: 'Kebede', phone: '+251911223344', position: 'Machine Operator', department: 'Fleet Operations', employmentType: 'Permanent', employmentStatus: 'Active', hireDate: '2023-01-15', assignments: [{ id: 'a-1', project: { id: 'p-1', projectName: 'Bole Road Expansion' }, site: { id: 's-1', siteName: 'Olympia Junction Site' } }] },
  { id: 'e-2', employeeCode: 'EMP-002', firstName: 'Mekdes', lastName: 'Alemu', phone: '+251911334455', position: 'Site Manager', department: 'Operations', employmentType: 'Permanent', employmentStatus: 'Active', hireDate: '2022-06-10', assignments: [{ id: 'a-2', project: { id: 'p-1', projectName: 'Bole Road Expansion' }, site: { id: 's-1', siteName: 'Olympia Junction Site' } }] },
  { id: 'e-3', employeeCode: 'EMP-003', firstName: 'Dawit', lastName: 'Tesfaye', phone: '+251912445566', position: 'Driver', department: 'Fleet Operations', employmentType: 'Contract', employmentStatus: 'Active', hireDate: '2023-05-01' },
  { id: 'e-4', employeeCode: 'EMP-004', firstName: 'Sara', lastName: 'Tadesse', phone: '+251915998877', position: 'Inventory Manager', department: 'Logistics', employmentType: 'Permanent', employmentStatus: 'Active', hireDate: '2022-11-20' },
  { id: 'e-5', employeeCode: 'EMP-005', firstName: 'Yonas', lastName: 'Getachew', phone: '+251913334455', position: 'Mechanic', department: 'Workshop', employmentType: 'Permanent', employmentStatus: 'Active', hireDate: '2023-03-12' },
  { id: 'e-6', employeeCode: 'EMP-006', firstName: 'Kidist', lastName: 'Haile', phone: '+251919776655', position: 'HR Officer', department: 'Administration', employmentType: 'Permanent', employmentStatus: 'Active', hireDate: '2023-08-01' },
  { id: 'e-7', employeeCode: 'EMP-007', firstName: 'Samuel', lastName: 'Girma', phone: '+251918882211', position: 'Foreman', department: 'Operations', employmentType: 'Permanent', employmentStatus: 'Active', hireDate: '2021-04-15' },
  { id: 'e-8', employeeCode: 'EMP-008', firstName: 'Biruk', lastName: 'Kebede', phone: '+251917773322', position: 'Daily Laborer', department: 'Operations', employmentType: 'Daily Laborer', employmentStatus: 'Active', hireDate: '2024-01-05' },
  { id: 'e-9', employeeCode: 'EMP-009', firstName: 'Hana', lastName: 'Tola', phone: '+251916664433', position: 'Mason', department: 'Construction', employmentType: 'Contract', employmentStatus: 'Active', hireDate: '2023-10-10' },
  { id: 'e-10', employeeCode: 'EMP-010', firstName: 'Tigist', lastName: 'Worku', phone: '+251915555544', position: 'Electrician', department: 'MEP', employmentType: 'Contract', employmentStatus: 'On Leave', hireDate: '2023-09-01' },
];

export default function EmployeesListPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>(fallbackEmployees);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function fetchEmployees() {
      if (useMockData) {
        setEmployees(fallbackEmployees);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/hr/employees`);
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        } else {
          setEmployees(fallbackEmployees);
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
        setEmployees(fallbackEmployees);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, [apiUrl, useMockData]);

  const filtered = employees.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      (e.employeeCode && e.employeeCode.toLowerCase().includes(search.toLowerCase())) ||
      (e.phone && e.phone.toLowerCase().includes(search.toLowerCase())) ||
      (e.position && e.position.toLowerCase().includes(search.toLowerCase()));

    const matchesPos = positionFilter === 'ALL' || e.position === positionFilter;
    const matchesType = typeFilter === 'ALL' || e.employmentType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || e.employmentStatus === statusFilter;

    return matchesSearch && matchesPos && matchesType && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading company employee directory..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/hr" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Employees Directory</h2>
            <p className="text-xs text-slate-500">Comprehensive roster of staff, site managers, mechanics, and site laborers.</p>
          </div>
        </div>

        <Link
          href="/dashboard/hr/employees/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <UserPlus size={16} />
          Add Employee
        </Link>
      </div>

      {/* Filter Card */}
      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, code, phone, position..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Positions</option>
              <option value="Machine Operator">Machine Operator</option>
              <option value="Site Manager">Site Manager</option>
              <option value="Driver">Driver</option>
              <option value="Inventory Manager">Inventory Manager</option>
              <option value="Mechanic">Mechanic</option>
              <option value="HR Officer">HR Officer</option>
              <option value="Foreman">Foreman</option>
              <option value="Daily Laborer">Daily Laborer</option>
              <option value="Mason">Mason</option>
              <option value="Electrician">Electrician</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Employment Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
              <option value="Daily Laborer">Daily Laborer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-md">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Employment Type</th>
                  <th className="py-3 px-4">Current Assignment</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No employee records found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp) => {
                    const activeAsg = emp.assignments && emp.assignments.length > 0 ? emp.assignments[0] : null;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {emp.employeeCode || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">
                          <Link href={`/dashboard/hr/employees/${emp.id}`} className="hover:text-[#0284c7]">
                            {emp.firstName} {emp.lastName}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {emp.phone || '-'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {emp.position}
                        </td>
                        <td className="py-3 px-4">
                          <EmploymentTypeBadge type={emp.employmentType} />
                        </td>
                        <td className="py-3 px-4">
                          {activeAsg ? (
                            <span className="font-semibold text-slate-800 text-[11px] block">
                              {activeAsg.project.projectName}
                              <span className="text-[10px] text-slate-400 block font-normal">{activeAsg.site.siteName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <EmployeeStatusBadge status={emp.employmentStatus} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/hr/employees/${emp.id}`}
                              className="p-1 text-slate-400 hover:text-slate-900 rounded"
                              title="View Details"
                            >
                              <Eye size={15} />
                            </Link>
                            <Link
                              href={`/dashboard/hr/employees/${emp.id}/edit`}
                              className="p-1 text-slate-400 hover:text-slate-900 rounded"
                              title="Edit Employee"
                            >
                              <Edit3 size={15} />
                            </Link>
                            <Link
                              href={`/dashboard/hr/assignments/new?employeeId=${emp.id}`}
                              className="p-1 text-[#0284c7] hover:bg-sky-50 rounded"
                              title="Assign to Site"
                            >
                              <Briefcase size={15} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
