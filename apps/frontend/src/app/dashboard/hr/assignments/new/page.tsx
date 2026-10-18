'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { apiFetch } from '@/lib/api';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface Project {
  id: string;
  projectName: string;
  sites?: Array<{ id: string; siteName: string }>;
}

function CreateAssignmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmpId = searchParams.get('employeeId') || '';

  const [employeeId, setEmployeeId] = useState(initialEmpId);
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [positionOnSite, setPositionOnSite] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; siteName: string }>>([]);
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
        return;
      }

      try {
        const [empRes, projRes] = await Promise.all([
          apiFetch(`${apiUrl}/hr/employees`),
          apiFetch(`${apiUrl}/projects`),
        ]);

        if (empRes.ok) setEmployees(await empRes.json());
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
      return;
    }
    const sel = projects.find((p) => p.id === projectId);
    setAvailableSites(sel?.sites || []);
    setSiteId('');
  }, [projectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError('Assignment end date cannot be before start date.');
      setSubmitting(false);
      return;
    }

    const payload = {
      employeeId,
      projectId,
      siteId,
      positionOnSite: positionOnSite || undefined,
      startDate,
      endDate: endDate || undefined,
      status,
      notes: notes || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Employee site assignment created!');
      router.push('/dashboard/hr/assignments');
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/hr/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create assignment');
      }

      router.push('/dashboard/hr/assignments');
    } catch (err: any) {
      setError(err.message || 'Server error creating employee assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/hr/assignments" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Assign Employee to Project Site</h2>
          <p className="text-xs text-slate-500">Deploy company staff, site managers, or operators to active contract plots.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Select Employee *</label>
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
              >
                <option value="">Select Employee...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.position})
                  </option>
                ))}
              </select>
            </div>

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

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Position / Designation on Site</label>
              <input
                type="text"
                value={positionOnSite}
                onChange={(e) => setPositionOnSite(e.target.value)}
                placeholder="Leave blank to use employee base position"
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Assignment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white font-bold"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Transferred">Transferred</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes / Scope Instructions</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific section or task assignment details..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard/hr/assignments"
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
                {submitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateAssignmentPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading assignment form..." />}>
      <CreateAssignmentForm />
    </Suspense>
  );
}
