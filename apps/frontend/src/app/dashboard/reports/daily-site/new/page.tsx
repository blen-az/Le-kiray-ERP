'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { apiFetch } from '@/lib/api';

interface Project {
  id: string;
  projectName: string;
  sites?: Array<{ id: string; siteName: string }>;
}

function CreateDailyReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjId = searchParams.get('projectId') || '';
  const initialSiteId = searchParams.get('siteId') || '';

  const [projectId, setProjectId] = useState(initialProjId);
  const [siteId, setSiteId] = useState(initialSiteId);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [weatherCondition, setWeatherCondition] = useState('Sunny');

  const [workCompleted, setWorkCompleted] = useState('');
  const [workPlannedTomorrow, setWorkPlannedTomorrow] = useState('');
  const [issuesOrBlockers, setIssuesOrBlockers] = useState('');
  const [safetyIncidents, setSafetyIncidents] = useState('');
  const [qualityIssues, setQualityIssues] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const [workersPresent, setWorkersPresent] = useState('12');
  const [workersAbsent, setWorkersAbsent] = useState('1');
  const [totalRegularHours, setTotalRegularHours] = useState('96');
  const [totalOvertimeHours, setTotalOvertimeHours] = useState('12');

  const [machineryUsedCount, setMachineryUsedCount] = useState('2');
  const [fuelUsedLiters, setFuelUsedLiters] = useState('250');
  const [materialsUsedValue, setMaterialsUsedValue] = useState('120000');

  const [photoUrls, setPhotoUrls] = useState('');
  const [documentUrls, setDocumentUrls] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; siteName: string }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadProjects() {
      if (useMockData) {
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
        const res = await apiFetch(`${apiUrl}/projects`);
        if (res.ok) setProjects(await res.json());
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    }

    loadProjects();
  }, [apiUrl, useMockData]);

  useEffect(() => {
    if (!projectId) {
      setAvailableSites([]);
      setSiteId('');
      return;
    }
    const sel = projects.find((p) => p.id === projectId);
    setAvailableSites(sel?.sites || []);
    if (!sel?.sites?.some((s) => s.id === siteId)) {
      setSiteId('');
    }
  }, [projectId, projects, siteId]);

  const handleSubmit = async (targetStatus: 'Draft' | 'Submitted') => {
    setSubmitting(true);
    setError(null);

    if (!workCompleted || !workCompleted.trim()) {
      setError('Work completed field is required before submitting report.');
      setSubmitting(false);
      return;
    }

    const photosArr = photoUrls
      ? photoUrls.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const docsArr = documentUrls
      ? documentUrls.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const payload = {
      projectId,
      siteId,
      reportDate,
      weatherCondition,
      workCompleted,
      workPlannedTomorrow: workPlannedTomorrow || undefined,
      issuesOrBlockers: issuesOrBlockers || undefined,
      safetyIncidents: safetyIncidents || undefined,
      qualityIssues: qualityIssues || undefined,
      generalNotes: generalNotes || undefined,
      workersPresent: parseInt(workersPresent, 10) || 0,
      workersAbsent: parseInt(workersAbsent, 10) || 0,
      totalRegularHours: parseFloat(totalRegularHours) || 0,
      totalOvertimeHours: parseFloat(totalOvertimeHours) || 0,
      machineryUsedCount: parseInt(machineryUsedCount, 10) || 0,
      fuelUsedLiters: parseFloat(fuelUsedLiters) || 0,
      materialsUsedValue: parseFloat(materialsUsedValue) || 0,
      photos: photosArr,
      documents: docsArr,
      status: targetStatus,
    };

    if (useMockData) {
      alert(`Demo Mode: Daily report saved as ${targetStatus}!`);
      router.push('/dashboard/reports/daily-site');
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/reports/daily-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save daily site report');
      }

      const created = await res.json();
      router.push(`/dashboard/reports/daily-site/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Server error creating daily site report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/reports/daily-site" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Create Daily Site Report</h2>
          <p className="text-xs text-slate-500">Record daily site operations, accomplishments, weather, equipment, fuel, and blockers.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Site Report Form</CardTitle>
          <CardDescription className="text-xs text-slate-500">All fields should accurately represent site conditions on the selected date.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-xs">
            {/* Project & Site Plot Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Report Date *</label>
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Weather Condition *</label>
              <select
                value={weatherCondition}
                onChange={(e) => setWeatherCondition(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white font-bold"
              >
                <option value="Sunny">Sunny</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Rainy">Rainy</option>
                <option value="Windy">Windy</option>
                <option value="Dusty">Dusty</option>
                <option value="Partly Cloudy">Partly Cloudy</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Accomplishments */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Work Completed Today *</label>
              <textarea
                required
                rows={3}
                value={workCompleted}
                onChange={(e) => setWorkCompleted(e.target.value)}
                placeholder="Detailed description of excavation, concrete pouring, rebar installation, or trenching accomplished today..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Work Planned Tomorrow</label>
              <textarea
                rows={2}
                value={workPlannedTomorrow}
                onChange={(e) => setWorkPlannedTomorrow(e.target.value)}
                placeholder="Planned targets and tasks for next shift..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            {/* Blockers & Incidents */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-900 text-xs">Issues, Safety & Quality Alerts</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Issues / Site Blockers</label>
                  <textarea
                    rows={2}
                    value={issuesOrBlockers}
                    onChange={(e) => setIssuesOrBlockers(e.target.value)}
                    placeholder="Material shortages, rain delays, design changes..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Safety Incidents / PPE Notes</label>
                  <textarea
                    rows={2}
                    value={safetyIncidents}
                    onChange={(e) => setSafetyIncidents(e.target.value)}
                    placeholder="Near misses, injuries, equipment slippage..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Operational Quantities */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-900 text-xs">Daily Resource Totals</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Workers Present</label>
                  <input
                    type="number"
                    min="0"
                    value={workersPresent}
                    onChange={(e) => setWorkersPresent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Workers Absent</label>
                  <input
                    type="number"
                    min="0"
                    value={workersAbsent}
                    onChange={(e) => setWorkersAbsent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Machinery Count</label>
                  <input
                    type="number"
                    min="0"
                    value={machineryUsedCount}
                    onChange={(e) => setMachineryUsedCount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Fuel Used (Liters)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={fuelUsedLiters}
                    onChange={(e) => setFuelUsedLiters(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Material Cost Value (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={materialsUsedValue}
                    onChange={(e) => setMaterialsUsedValue(e.target.value)}
                    placeholder="e.g. 120000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Photo URLs (comma separated)</label>
                  <input
                    type="text"
                    value={photoUrls}
                    onChange={(e) => setPhotoUrls(e.target.value)}
                    placeholder="https://storage.lekiray.et/site-1/photo1.jpg, ..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard/reports/daily-site"
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('Draft')}
                className="flex items-center gap-1.5 border border-slate-300 hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-md font-bold transition-colors disabled:opacity-50"
              >
                <Save size={15} />
                Save as Draft
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('Submitted')}
                className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-5 py-2 rounded-md font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Send size={15} />
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateDailyReportPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading report form..." />}>
      <CreateDailyReportForm />
    </Suspense>
  );
}
