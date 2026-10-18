'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  Briefcase,
  CalendarCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Wrench,
  Fuel,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { EmployeeStatusBadge } from '@/components/hr/EmployeeStatusBadge';
import { EmploymentTypeBadge } from '@/components/hr/EmploymentTypeBadge';
import { AttendanceStatusBadge } from '@/components/hr/AttendanceStatusBadge';
import { LeaveStatusBadge } from '@/components/hr/LeaveStatusBadge';
import { formatCurrency } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface EmployeeDetail {
  id: string;
  employeeCode?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  nationalIdNumber?: string;
  position: string;
  department?: string;
  employmentType: string;
  employmentStatus: string;
  hireDate?: string;
  dailyRate?: number;
  monthlySalary?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  documentUrl?: string;
  notes?: string;
  site?: { id: string; siteName: string };
  assignments?: Array<{
    id: string;
    positionOnSite?: string;
    startDate: string;
    endDate?: string;
    status: string;
    project: { id: string; projectName: string };
    site: { id: string; siteName: string };
  }>;
  attendance?: Array<{
    id: string;
    attendanceDate: string;
    status: string;
    regularHours: number;
    overtimeHours: number;
    notes?: string;
    project?: { projectName: string };
    site?: { siteName: string };
  }>;
  leaveRequests?: Array<{
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
    reason?: string;
  }>;
  currentMachines?: Array<{
    id: string;
    brand: string;
    model: string;
    plateNumber?: string;
    currentStatus: string;
  }>;
  fuelLogs?: Array<{
    id: string;
    litersUsed: number;
    totalCost: number;
    usageDate: string;
    machine?: { brand: string; model: string };
  }>;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'assignments' | 'attendance' | 'leave' | 'machinery' | 'fuel' | 'documents'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadDetail() {
      if (useMockData) {
        setEmployee({
          id,
          employeeCode: 'EMP-001',
          firstName: 'Abebe',
          middleName: 'Bekele',
          lastName: 'Kebede',
          phone: '+251911223344',
          email: 'abebe.k@lekiray.et',
          gender: 'Male',
          dateOfBirth: '1990-05-15',
          nationalIdNumber: 'FIN-12345678',
          position: 'Machine Operator',
          department: 'Fleet Operations',
          employmentType: 'Permanent',
          employmentStatus: 'Active',
          hireDate: '2023-01-15',
          dailyRate: 500,
          monthlySalary: 13000,
          emergencyContactName: 'Kebede Tadesse',
          emergencyContactPhone: '+251911998877',
          address: 'Bole Subcity, Woreda 03, House #123, Addis Ababa',
          notes: 'Certified CAT Excavator and Volvo Loader Heavy Equipment Operator.',
          site: { id: 's-1', siteName: 'Olympia Junction Site' },
          assignments: [
            {
              id: 'a-1',
              positionOnSite: 'Senior Machine Operator',
              startDate: '2024-01-01',
              status: 'Active',
              project: { id: 'p-1', projectName: 'Bole Road Expansion' },
              site: { id: 's-1', siteName: 'Olympia Junction Site' },
            },
          ],
          attendance: [
            {
              id: 'att-1',
              attendanceDate: new Date().toISOString(),
              status: 'Present',
              regularHours: 8,
              overtimeHours: 2,
              project: { projectName: 'Bole Road Expansion' },
              site: { siteName: 'Olympia Junction Site' },
            },
          ],
          leaveRequests: [
            {
              id: 'l-1',
              leaveType: 'Annual Leave',
              startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
              endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
              totalDays: 7,
              status: 'Pending',
              reason: 'Family vacation and annual holiday leave.',
            },
          ],
          currentMachines: [
            { id: 'm-1', brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234', currentStatus: 'Active' },
          ],
          fuelLogs: [
            { id: 'f-1', litersUsed: 200, totalCost: 22100, usageDate: new Date().toISOString(), machine: { brand: 'CAT', model: '320D Excavator' } },
          ],
        });
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/hr/employees/${id}`);
        if (!res.ok) throw new Error('Employee record not found');
        const data = await res.json();
        setEmployee(data);
      } catch (err: any) {
        setError(err.message || 'Error loading employee profile');
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [id, apiUrl, useMockData]);

  if (loading) return <LoadingState message="Loading employee HR master record..." />;

  if (error || !employee) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Employee Not Found'}</div>
        <Link href="/dashboard/hr/employees" className="text-xs text-[#0284c7] underline font-semibold">
          Return to Employees Directory
        </Link>
      </div>
    );
  }

  const activeAsg = employee.assignments && employee.assignments.length > 0 ? employee.assignments[0] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/hr/employees" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ''}{employee.lastName}
              </h2>
              <EmployeeStatusBadge status={employee.employmentStatus} />
              <EmploymentTypeBadge type={employee.employmentType} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Code: {employee.employeeCode || 'N/A'} • Position: {employee.position}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/hr/employees/${employee.id}/edit`}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <Edit3 size={15} />
            Edit Profile
          </Link>
          <Link
            href={`/dashboard/hr/assignments/new?employeeId=${employee.id}`}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <Briefcase size={15} />
            Assign to Site
          </Link>
          <Link
            href={`/dashboard/hr/attendance/new?employeeId=${employee.id}`}
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-xs"
          >
            <CalendarCheck size={15} />
            Record Attendance
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'assignments', label: 'Assignments' },
          { id: 'attendance', label: 'Attendance Ledger' },
          { id: 'leave', label: 'Leave Requests' },
          { id: 'machinery', label: 'Assigned Fleet' },
          { id: 'fuel', label: 'Fuel Operations' },
          { id: 'documents', label: 'Documents' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-[#0284c7] text-[#0284c7]'
                : 'hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Employment & Personal Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone Number</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{employee.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{employee.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Department</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{employee.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Hire Date</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Daily Rate</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {employee.dailyRate ? formatCurrency(employee.dailyRate) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Base Salary</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">
                    {employee.monthlySalary ? formatCurrency(employee.monthlySalary) : 'N/A'}
                  </span>
                </div>
              </div>

              {employee.address && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Residential Address</span>
                  <p className="mt-0.5 text-slate-700">{employee.address}</p>
                </div>
              )}

              {employee.notes && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Special Notes & Certifications</span>
                  <p className="mt-0.5 text-slate-600 leading-relaxed">{employee.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Card: Active Site Assignment */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Current Site Deployment</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {activeAsg ? (
                <div className="space-y-2">
                  <span className="px-2 py-0.5 bg-sky-50 text-[#0284c7] rounded font-bold text-[10px] inline-block border border-sky-100">
                    Active Assignment
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm">{activeAsg.project.projectName}</h4>
                  <div className="text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{activeAsg.site.siteName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={13} className="text-slate-400" />
                      <span>Role: {activeAsg.positionOnSite || employee.position}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400">Not assigned to any active project site.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'assignments' && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Project Assignment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            {(!employee.assignments || employee.assignments.length === 0) ? (
              <div className="p-8 text-center text-slate-400">No project assignments recorded.</div>
            ) : (
              <table className="w-full text-left text-slate-600">
                <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Site Plot</th>
                    <th className="py-3 px-4">Position on Site</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employee.assignments.map((asg) => (
                    <tr key={asg.id}>
                      <td className="py-3 px-4 font-bold text-slate-900">{asg.project.projectName}</td>
                      <td className="py-3 px-4 font-medium">{asg.site.siteName}</td>
                      <td className="py-3 px-4">{asg.positionOnSite || employee.position}</td>
                      <td className="py-3 px-4">{new Date(asg.startDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                          {asg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'attendance' && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Recent Attendance Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            {(!employee.attendance || employee.attendance.length === 0) ? (
              <div className="p-8 text-center text-slate-400">No attendance entries recorded for this employee.</div>
            ) : (
              <table className="w-full text-left text-slate-600">
                <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Project & Site</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Regular Hours</th>
                    <th className="py-3 px-4 text-right">Overtime Hours</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employee.attendance.map((att) => (
                    <tr key={att.id}>
                      <td className="py-3 px-4 font-medium text-slate-800">{new Date(att.attendanceDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{att.project?.projectName} ({att.site?.siteName})</td>
                      <td className="py-3 px-4">
                        <AttendanceStatusBadge status={att.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-bold">{att.regularHours}h</td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-600">{att.overtimeHours}h</td>
                      <td className="py-3 px-4 text-slate-400">{att.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'leave' && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Leave Requests History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            {(!employee.leaveRequests || employee.leaveRequests.length === 0) ? (
              <div className="p-8 text-center text-slate-400">No leave requests logged.</div>
            ) : (
              <table className="w-full text-left text-slate-600">
                <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4 text-right">Days</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employee.leaveRequests.map((l) => (
                    <tr key={l.id}>
                      <td className="py-3 px-4 font-bold text-slate-900">{l.leaveType}</td>
                      <td className="py-3 px-4">{new Date(l.startDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right font-extrabold">{l.totalDays}</td>
                      <td className="py-3 px-4 text-center">
                        <LeaveStatusBadge status={l.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-500">{l.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'machinery' && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Operated Heavy Machinery</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs">
            {(!employee.currentMachines || employee.currentMachines.length === 0) ? (
              <div className="py-6 text-center text-slate-400">No machinery assigned to this operator.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employee.currentMachines.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{m.brand} {m.model}</span>
                      <span className="text-[10px] text-slate-400">Plate: {m.plateNumber || 'N/A'}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded">
                      {m.currentStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'fuel' && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Fuel Dispense Audit History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            {(!employee.fuelLogs || employee.fuelLogs.length === 0) ? (
              <div className="p-8 text-center text-slate-400">No fuel refuel logs associated with this employee.</div>
            ) : (
              <table className="w-full text-left text-slate-600">
                <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Usage Date</th>
                    <th className="py-3 px-4">Refueled Machine</th>
                    <th className="py-3 px-4 text-right">Liters Used</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employee.fuelLogs.map((fl) => (
                    <tr key={fl.id}>
                      <td className="py-3 px-4 font-medium">{new Date(fl.usageDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-bold">{fl.machine ? `${fl.machine.brand} ${fl.machine.model}` : 'Machine'}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">{fl.litersUsed} L</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatCurrency(fl.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Contracts & Certificates</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs">
            {employee.documentUrl ? (
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-md flex justify-between items-center text-[#0284c7]">
                <div>
                  <span className="font-bold block">Employment Contract PDF</span>
                  <span className="text-[10px] text-slate-500">{employee.documentUrl}</span>
                </div>
                <a href={employee.documentUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-[#0284c7] text-white rounded font-bold text-xs">
                  View Document
                </a>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">No scanned contract files uploaded for this employee.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
