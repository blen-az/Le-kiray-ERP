'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditDailyReportPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [weatherCondition, setWeatherCondition] = useState('Sunny');
  const [workCompleted, setWorkCompleted] = useState('');
  const [workPlannedTomorrow, setWorkPlannedTomorrow] = useState('');
  const [issuesOrBlockers, setIssuesOrBlockers] = useState('');
  const [safetyIncidents, setSafetyIncidents] = useState('');
  const [qualityIssues, setQualityIssues] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const [workersPresent, setWorkersPresent] = useState('0');
  const [workersAbsent, setWorkersAbsent] = useState('0');
  const [totalRegularHours, setTotalRegularHours] = useState('0');
  const [totalOvertimeHours, setTotalOvertimeHours] = useState('0');

  const [machineryUsedCount, setMachineryUsedCount] = useState('0');
  const [fuelUsedLiters, setFuelUsedLiters] = useState('0');
  const [materialsUsedValue, setMaterialsUsedValue] = useState('0');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadReport() {
      if (useMockData) {
        setWeatherCondition('Sunny');
        setWorkCompleted('Excavated 180m underpass trench line.');
        setWorkPlannedTomorrow('Cast main retaining wall foundation footings.');
        setIssuesOrBlockers('Minor aggregate dump truck delay.');
        setWorkersPresent('14');
        setWorkersAbsent('1');
        setMachineryUsedCount('3');
        setFuelUsedLiters('450');
        setMaterialsUsedValue('185000');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/reports/daily-site/${id}`);
        if (!res.ok) throw new Error('Daily report not found');
        const r = await res.json();

        setWeatherCondition(r.weatherCondition || 'Sunny');
        setWorkCompleted(r.workCompleted || '');
        setWorkPlannedTomorrow(r.workPlannedTomorrow || '');
        setIssuesOrBlockers(r.issuesOrBlockers || '');
        setSafetyIncidents(r.safetyIncidents || '');
        setQualityIssues(r.qualityIssues || '');
        setGeneralNotes(r.generalNotes || '');
        setWorkersPresent(r.workersPresent?.toString() || '0');
        setWorkersAbsent(r.workersAbsent?.toString() || '0');
        setTotalRegularHours(r.totalRegularHours?.toString() || '0');
        setTotalOvertimeHours(r.totalOvertimeHours?.toString() || '0');
        setMachineryUsedCount(r.machineryUsedCount?.toString() || '0');
        setFuelUsedLiters(r.fuelUsedLiters?.toString() || '0');
        setMaterialsUsedValue(r.materialsUsedValue?.toString() || '0');
      } catch (err: any) {
        setError(err.message || 'Error loading report details');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id, apiUrl, useMockData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
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
    };

    if (useMockData) {
      alert('Demo Mode: Report updated!');
      router.push(`/dashboard/reports/daily-site/${id}`);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/reports/daily-site/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update report');
      }

      router.push(`/dashboard/reports/daily-site/${id}`);
    } catch (err: any) {
      setError(err.message || 'Error updating report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading report data..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/reports/daily-site/${id}`} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Edit Daily Site Report</h2>
          <p className="text-xs text-slate-500">Update work accomplished, weather, blockers, or resource quantities.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Edit Report Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Work Completed Today *</label>
              <textarea
                required
                rows={3}
                value={workCompleted}
                onChange={(e) => setWorkCompleted(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Work Planned Tomorrow</label>
              <textarea
                rows={2}
                value={workPlannedTomorrow}
                onChange={(e) => setWorkPlannedTomorrow(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Issues / Blockers</label>
                <textarea
                  rows={2}
                  value={issuesOrBlockers}
                  onChange={(e) => setIssuesOrBlockers(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Safety Incidents</label>
                <textarea
                  rows={2}
                  value={safetyIncidents}
                  onChange={(e) => setSafetyIncidents(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

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

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href={`/dashboard/reports/daily-site/${id}`}
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
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
