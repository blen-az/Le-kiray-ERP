'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  siteId?: string;
  assignments?: Array<{ projectId: string; siteId: string }>;
}

interface Project {
  id: string;
  projectName: string;
  sites?: Array<{ id: string; siteName: string }>;
}

function RecordAttendanceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmpId = searchParams.get('employeeId') || '';

  const [employeeId, setEmployeeId] = useState(initialEmpId);
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('Present');
  const [checkInTime, setCheckInTime] = useState('08:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00');
  const [regularHours, setRegularHours] = useState('8');
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [notes, setNotes] = useState('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; siteName: string }>>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadFormData() {
      if (useMockData) {
        setEmployees([
          { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede', position: 'Machine Operator' },
          { id: 'e-2', firstName: 'Mekdes', lastName: 'Alemu', position: 'Site Manager' },
          { id: 'e-3', firstName: 'Dawit', lastName: 'Tesfaye', position: 'Driver' },
        ]);
        setProjects([
          {
            id: 'p-1',
            projectName: 'Bole Road Expansion',
            sites: [
              { id: 's-1', siteName: 'Olympia Junction Site' },
              { id: 's-2', siteName: 'Rwanda Traffic Circle Site' },
            ],
          },
          {
            id: 'p-2',
            projectName: 'Hawassa Housing Project',
            sites: [{ id: 's-3', siteName: 'Hawassa Lake Side site' }],
          },
        ]);
        setFilteredEmployees([
          { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede', position: 'Machine Operator' },
          { id: 'e-2', firstName: 'Mekdes', lastName: 'Alemu', position: 'Site Manager' },
          { id: 'e-3', firstName: 'Dawit', lastName: 'Tesfaye', position: 'Driver' },
        ]);
        return;
      }

      try {
        const [empRes, projRes] = await Promise.all([
          fetch(`${apiUrl}/hr/employees`),
          fetch(`${apiUrl}/projects`),
        ]);

        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData);
          setFilteredEmployees(empData);
        }
        if (projRes.ok) setProjects(await projRes.json());
      } catch (err) {
        console.error('Error loading dropdowns:', err);
      }
    }

    loadFormData();
  }, [apiUrl, useMockData]);

  // Update site options when project changes
  useEffect(() => {
    if (!projectId) {
      setAvailableSites([]);
      setSiteId('');
      setFilteredEmployees(employees);
      return;
    }
    const sel = projects.find((p) => p.id === projectId);
    setAvailableSites(sel?.sites || []);
    setSiteId('');

    // Filter employees assigned to this project
    const assigned = employees.filter((e) =>
      e.assignments?.some((a) => a.projectId === projectId),
    );
    setFilteredEmployees(assigned.length > 0 ? assigned : employees);
  }, [projectId, projects, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const checkInIso = checkInTime ? `${attendanceDate}T${checkInTime}:00.000Z` : undefined;
    const checkOutIso = checkOutTime ? `${attendanceDate}T${checkOutTime}:00.000Z` : undefined;

    if (checkInIso && checkOutIso && new Date(checkOutIso) < new Date(checkInIso)) {
      setError('Check-out time cannot be before check-in time');
      setSubmitting(false);
      return;
    }

    const payload = {
      employeeId,
      projectId,
      siteId,
      attendanceDate,
      status,
      checkInTime: checkInIso,
      checkOutTime: checkOutIso,
      regularHours: parseFloat(regularHours) || 8,
      overtimeHours: parseFloat(overtimeHours) || 0,
      notes: notes || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Daily attendance recorded!');
      router.push('/dashboard/hr/attendance');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/hr/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to record attendance');
      }

      router.push('/dashboard/hr/attendance');
    } catch (err: any) {
      setError(err.message || 'Server error recording attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/hr/attendance" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Record Daily Site Attendance</h2>
          <p className="text-xs text-slate-500">Log employee check-in/out times, presence status, and overtime hours.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Daily Attendance Entry Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Project Contract *</label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Site Plot *</label>
                <select
                  required
                  disabled={!projectId}
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white disabled:opacity-50"
                >
                  <option value="">Select Site...</option>
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Select Employee *</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Select Employee...</option>
                  {filteredEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Attendance Date *</label>
                <input
                  type="date"
                  required
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status *</label>
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white font-bold"
                >
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

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Check-in Time</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Check-out Time</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Regular Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="any"
                  value={regularHours}
                  onChange={(e) => setRegularHours(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Overtime Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="any"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes / Task Accomplishment Remarks</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Overtime for foundation concrete casting"
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard/hr/attendance"
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-5 py-2 rounded-md font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save size={15} />
                {submitting ? 'Recording...' : 'Save Attendance Log'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RecordAttendancePage() {
  return (
    <Suspense fallback={<LoadingState message="Loading attendance form..." />}>
      <RecordAttendanceForm />
    </Suspense>
  );
}
