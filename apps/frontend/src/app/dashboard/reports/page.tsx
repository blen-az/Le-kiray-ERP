'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search, MapPin, Calendar, Clock, AlertTriangle, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { formatDate } from '../../../lib/utils';

interface DailyReport {
  id: string;
  date: string;
  workCompleted: string;
  machineryUsed: string | null;
  workersPresent: number;
  materialsUsed: string | null;
  fuelUsed: number | null;
  issuesBlockers: string | null;
  project: { name: string };
  site: { name: string };
  submittedBy: { firstName: string; lastName: string };
}

const fallbackReports: DailyReport[] = [
  {
    id: 'dr-1',
    date: new Date().toISOString(),
    workCompleted: 'Excavated 150m trench line. Laid base course level from chainage 1+200 to 1+350. Completed asphalt edge cutting.',
    machineryUsed: 'CAT 320D Excavator (8 hrs active), Volvo L90 Loader (4 hrs active), Sinotruk Dump Truck (10 trips)',
    workersPresent: 18,
    materialsUsed: 'Cement: 25 bags, Sand: 5m3, Diesel: 200 Liters',
    fuelUsed: 200,
    issuesBlockers: 'High congestion at Olympia intersection delayed dump truck return loops. Rain started around 4:30 PM, causing early site closure.',
    project: { name: 'Bole Road Expansion' },
    site: { name: 'Olympia Junction Site' },
    submittedBy: { firstName: 'Almaz', lastName: 'Desta' },
  },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>(fallbackReports);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [projectId, setProjectId] = useState('p-1');
  const [siteId, setSiteId] = useState('s-1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workCompleted, setWorkCompleted] = useState('');
  const [machineryUsed, setMachineryUsed] = useState('');
  const [workersPresent, setWorkersPresent] = useState('18');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [fuelUsed, setFuelUsed] = useState('');
  const [issuesBlockers, setIssuesBlockers] = useState('');

  useEffect(() => {
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    async function fetchReports() {
      if (useMockData) {
        setReports(fallbackReports);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/reports`);
        if (!res.ok) throw new Error('Failed to load reports from backend database');
        setReports(await res.json());
        setError(null);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Could not connect to ERP server');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workCompleted.trim()) return;

    const newReport: DailyReport = {
      id: Math.random().toString(),
      date: new Date(date).toISOString(),
      workCompleted,
      machineryUsed: machineryUsed || null,
      workersPresent: parseInt(workersPresent) || 0,
      materialsUsed: materialsUsed || null,
      fuelUsed: parseFloat(fuelUsed) || null,
      issuesBlockers: issuesBlockers || null,
      project: { name: 'Bole Road Expansion' },
      site: { name: 'Olympia Junction Site' },
      submittedBy: { firstName: 'Almaz', lastName: 'Desta' },
    };

    try {
      const res = await fetch('http://localhost:4000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'p-1', // Seed matching values
          siteId: 's-1',
          date,
          workCompleted,
          machineryUsed,
          workersPresent: parseInt(workersPresent) || 0,
          materialsUsed,
          fuelUsed: parseFloat(fuelUsed) || 0,
          issuesBlockers,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setReports([saved, ...reports]);
      } else {
        setReports([newReport, ...reports]);
      }
    } catch {
      setReports([newReport, ...reports]);
    }

    setWorkCompleted('');
    setMachineryUsed('');
    setMaterialsUsed('');
    setFuelUsed('');
    setIssuesBlockers('');
    setShowAddForm(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading daily report archive...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg max-w-2xl mx-auto my-12 shadow-xs">
        <h3 className="font-bold text-sm">ERP Connection Error</h3>
        <p className="text-xs mt-1">{error}</p>
        <p className="text-xs mt-3 text-slate-500 border-t border-rose-200/50 pt-2 font-medium">
          Ensure the backend NestJS service is running and accessible. Or toggle <code>NEXT_PUBLIC_USE_MOCK_DATA=true</code> in the environment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Daily Site Reports</h2>
          <p className="text-slate-500 text-xs">Compile and review daily construction progress, labor, machinery hours, and material dispatches.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={16} />
          {showAddForm ? 'Cancel' : 'Submit Daily Report'}
        </button>
      </div>

      {showAddForm && (
        <Card className="max-w-xl animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Log Daily Construction Progress</CardTitle>
            <CardDescription>Fill out site activity notes, resource inputs, and log site blockers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Project / Site *</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  >
                    <option value="s-1">Olympia Junction (Bole Road Expansion)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Report Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-slate-700">Work Completed Today *</label>
                <textarea
                  required
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  placeholder="Describe excavations, asphalt layouts, concrete pours completed today..."
                  className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 h-20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Labor Count *</label>
                  <input
                    type="number"
                    required
                    value={workersPresent}
                    onChange={(e) => setWorkersPresent(e.target.value)}
                    placeholder="18"
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Fuel Used (Liters)</label>
                  <input
                    type="number"
                    value={fuelUsed}
                    onChange={(e) => setFuelUsed(e.target.value)}
                    placeholder="200"
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Materials Used</label>
                  <input
                    type="text"
                    value={materialsUsed}
                    onChange={(e) => setMaterialsUsed(e.target.value)}
                    placeholder="Cement: 25 bags..."
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-slate-700">Machinery Used Details</label>
                <input
                  type="text"
                  value={machineryUsed}
                  onChange={(e) => setMachineryUsed(e.target.value)}
                  placeholder="CAT 320D Excavator (8 hrs active)..."
                  className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-slate-700">Issues & Site Blockers</label>
                <textarea
                  value={issuesBlockers}
                  onChange={(e) => setIssuesBlockers(e.target.value)}
                  placeholder="Rains, utility line conflicts, traffic loops delay or machines breakdown..."
                  className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
              >
                Submit Report
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reports Feed */}
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-xs transition-shadow">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-[#0284c7]/10 text-[#0284c7] px-2.5 py-0.5 rounded-md border border-[#0284c7]/20">
                    {report.project.name}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <MapPin size={12} className="text-sky-500" /> {report.site.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(report.date)}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <UserCheck size={12} className="text-slate-400" />
                    By: {report.submittedBy.firstName} {report.submittedBy.lastName}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Completed Work */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Activities Completed</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {report.workCompleted}
                </p>
              </div>

              {/* Resource grid */}
              <div className="grid gap-4 md:grid-cols-4 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Headcount</span>
                  <span className="text-xs font-bold text-slate-800">{report.workersPresent} Workers</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Machinery Active</span>
                  <span className="text-xs font-semibold text-slate-700 truncate block">
                    {report.machineryUsed || 'None logged'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Materials Dispatched</span>
                  <span className="text-xs font-semibold text-slate-700 truncate block">
                    {report.materialsUsed || 'None logged'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Diesel Burned</span>
                  <span className="text-xs font-bold text-slate-800">
                    {report.fuelUsed ? `${report.fuelUsed} Liters` : '0 Liters'}
                  </span>
                </div>
              </div>

              {/* Blockers Alert banner */}
              {report.issuesBlockers && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 p-3 rounded-md text-xs text-rose-800 animate-pulse">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-rose-900 block uppercase tracking-wider text-[10px] mb-0.5">Logged Site Blocker</strong>
                    {report.issuesBlockers}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
