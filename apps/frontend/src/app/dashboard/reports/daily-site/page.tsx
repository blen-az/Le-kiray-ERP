'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Building2,
  MapPin,
  Eye,
  Edit3,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { DailyReportStatusBadge } from '@/components/reports/DailyReportStatusBadge';
import { WeatherBadge } from '@/components/reports/WeatherBadge';
import { formatCurrency } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface DailyReportItem {
  id: string;
  reportDate: string;
  status: string;
  weatherCondition: string;
  workCompleted: string;
  issuesOrBlockers?: string;
  safetyIncidents?: string;
  workersPresent: number;
  workersAbsent: number;
  machineryUsedCount: number;
  fuelUsedLiters: number;
  materialsUsedValue: number;
  project?: { id: string; projectName: string; projectCode?: string };
  site?: { id: string; siteName: string; location?: string };
  submittedBy?: { id: string; firstName: string; lastName: string };
  approvedBy?: { id: string; firstName: string; lastName: string };
}

interface SummaryKpis {
  totalReports: number;
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
  draftCount: number;
  missingTodayCount: number;
  submittedTodayCount: number;
  blockerReportsCount: number;
  safetyIncidentsCount: number;
}

const fallbackReports: DailyReportItem[] = [
  {
    id: 'rep-1',
    reportDate: new Date(Date.now() - 86400000).toISOString(),
    status: 'Approved',
    weatherCondition: 'Sunny',
    workCompleted: 'Excavated 180m underpass trench line, installed 40m PVC drainage piping, and poured 45m3 lean concrete.',
    issuesOrBlockers: 'Minor aggregate dump truck delay.',
    safetyIncidents: 'No safety incidents reported.',
    workersPresent: 14,
    workersAbsent: 1,
    machineryUsedCount: 3,
    fuelUsedLiters: 450,
    materialsUsedValue: 185000,
    project: { id: 'p-1', projectName: 'Bole Road Expansion', projectCode: 'BOLE-001' },
    site: { id: 's-1', siteName: 'Olympia Junction Site' },
    submittedBy: { id: 'u-1', firstName: 'Mekdes', lastName: 'Alemu' },
    approvedBy: { id: 'u-2', firstName: 'Tadesse', lastName: 'CEO' },
  },
  {
    id: 'rep-2',
    reportDate: new Date().toISOString(),
    status: 'Submitted',
    weatherCondition: 'Cloudy',
    workCompleted: 'Completed Block B ground floor masonry wall levelling and column formwork assembly.',
    issuesOrBlockers: 'Material Shortage: Urgent request pending for 16mm rebar tonnage.',
    safetyIncidents: 'No injuries. Scaffold clamp slipped.',
    workersPresent: 18,
    workersAbsent: 2,
    machineryUsedCount: 2,
    fuelUsedLiters: 180,
    materialsUsedValue: 95000,
    project: { id: 'p-2', projectName: 'Hawassa Housing Project', projectCode: 'HAW-002' },
    site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
    submittedBy: { id: 'u-1', firstName: 'Mekdes', lastName: 'Alemu' },
  },
  {
    id: 'rep-3',
    reportDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'Rejected',
    weatherCondition: 'Rainy',
    workCompleted: 'Sub-base soil compaction halted due to heavy afternoon rain.',
    issuesOrBlockers: 'Rain flooded lower trench section.',
    safetyIncidents: 'Near miss: Dump truck wheel skidded on wet mud ramp.',
    workersPresent: 10,
    workersAbsent: 4,
    machineryUsedCount: 2,
    fuelUsedLiters: 120,
    materialsUsedValue: 32000,
    project: { id: 'p-1', projectName: 'Bole Road Expansion', projectCode: 'BOLE-001' },
    site: { id: 's-2', siteName: 'Rwanda Traffic Circle Site' },
    submittedBy: { id: 'u-1', firstName: 'Mekdes', lastName: 'Alemu' },
  },
];

export default function DailySiteReportsDashboardPage() {
  const [reports, setReports] = useState<DailyReportItem[]>(fallbackReports);
  const [kpis, setKpis] = useState<SummaryKpis>({
    totalReports: 4,
    submittedCount: 1,
    approvedCount: 1,
    rejectedCount: 1,
    draftCount: 1,
    missingTodayCount: 1,
    submittedTodayCount: 1,
    blockerReportsCount: 2,
    safetyIncidentsCount: 1,
  });

  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadDashboardData() {
      if (useMockData) {
        setReports(fallbackReports);
        setLoading(false);
        return;
      }

      try {
        const [repRes, sumRes, todayRes] = await Promise.all([
          apiFetch(`${apiUrl}/reports/daily-site`),
          apiFetch(`${apiUrl}/reports/daily-site/summary`),
          apiFetch(`${apiUrl}/reports/daily-site/today`),
        ]);

        if (repRes.ok) setReports(await repRes.json());
        if (sumRes.ok && todayRes.ok) {
          const sumData = await sumRes.json();
          const todayData = await todayRes.json();
          setKpis({
            totalReports: sumData.totalReports,
            submittedCount: sumData.submittedCount,
            approvedCount: sumData.approvedCount,
            rejectedCount: sumData.rejectedCount,
            draftCount: sumData.draftCount,
            missingTodayCount: todayData.missingCount,
            submittedTodayCount: todayData.submittedCount,
            blockerReportsCount: sumData.blockerReportsCount,
            safetyIncidentsCount: sumData.safetyIncidentsCount,
          });
        }
      } catch (err) {
        console.error('Error loading daily site reports dashboard:', err);
        setReports(fallbackReports);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [apiUrl, useMockData]);

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.workCompleted.toLowerCase().includes(search.toLowerCase()) ||
      (r.project?.projectName && r.project.projectName.toLowerCase().includes(search.toLowerCase())) ||
      (r.site?.siteName && r.site.siteName.toLowerCase().includes(search.toLowerCase())) ||
      (r.issuesOrBlockers && r.issuesOrBlockers.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesProject = projectFilter === 'ALL' || r.project?.id === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const highRiskReports = reports.filter(
    (r) => (r.issuesOrBlockers && r.issuesOrBlockers.trim().length > 0) || (r.safetyIncidents && r.safetyIncidents.trim().length > 0),
  );

  if (loading) return <LoadingState message="Loading daily site report dashboard & operational metrics..." />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Daily Site Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Daily operational log for construction sites, work completed, equipment hours, fuel, and blockers.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/reports/daily-site/today"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <Clock size={14} />
            Today's Sites Compliance
          </Link>
          <Link
            href="/dashboard/reports/daily-site/summary"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <TrendingUp size={14} />
            Analytics Summary
          </Link>
          <Link
            href="/dashboard/reports/daily-site/new"
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-xs transition-colors"
          >
            <Plus size={15} />
            Create Daily Report
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports (This Month)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{kpis.totalReports} Logged</div>
              <span className="text-[10px] text-emerald-600 font-semibold">{kpis.approvedCount} Approved</span>
            </div>
            <div className="p-3 bg-sky-50 text-[#0284c7] rounded-lg">
              <FileText size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted Today</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{kpis.submittedTodayCount} Sites</div>
              <span className="text-[10px] text-slate-500 font-medium">Recorded for today</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileCheck2 size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Missing Today</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{kpis.missingTodayCount} Sites</div>
              <Link href="/dashboard/reports/daily-site/today" className="text-[10px] text-[#0284c7] font-semibold hover:underline">
                View Missing List →
              </Link>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approval</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{kpis.submittedCount} Pending</div>
              <span className="text-[10px] text-amber-700 font-semibold">{kpis.rejectedCount} Rejected</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Site Blockers / Risks</span>
              <div className="text-2xl font-black text-rose-700 mt-1">{kpis.blockerReportsCount} Alerts</div>
              <span className="text-[10px] text-rose-600 font-semibold">{kpis.safetyIncidentsCount} Safety incidents</span>
            </div>
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg">
              <ShieldAlert size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: High-Risk Alert Section & Recent Reports Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Risk Alerts Side Banner */}
        <Card className="border border-rose-200 bg-rose-50/20 shadow-xs">
          <CardHeader className="pb-3 border-b border-rose-100 flex items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-rose-600" />
              High-Risk & Blocker Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            {highRiskReports.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No active site blockers or safety incidents reported.</div>
            ) : (
              <div className="divide-y divide-rose-100">
                {highRiskReports.map((r) => (
                  <div key={r.id} className="p-3.5 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-slate-900 block">{r.project?.projectName}</span>
                      <DailyReportStatusBadge status={r.status} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium block">{r.site?.siteName} • {new Date(r.reportDate).toLocaleDateString()}</span>
                    
                    {r.issuesOrBlockers && (
                      <div className="p-2 bg-rose-100/60 text-rose-900 border border-rose-200 rounded text-[11px] font-medium">
                        <strong>Blocker:</strong> {r.issuesOrBlockers}
                      </div>
                    )}
                    {r.safetyIncidents && (
                      <div className="p-2 bg-amber-100/60 text-amber-900 border border-amber-200 rounded text-[11px] font-medium">
                        <strong>Safety Note:</strong> {r.safetyIncidents}
                      </div>
                    )}

                    <Link href={`/dashboard/reports/daily-site/${r.id}`} className="text-xs font-bold text-[#0284c7] hover:underline block text-right">
                      View Full Details →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Directory Table */}
        <Card className="lg:col-span-2 border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Recent Site Reports Log</CardTitle>
            <CardDescription className="text-xs text-slate-500">Chronological daily site reporting audit trail across project sites.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search work completed, project, site, or blockers..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-md text-xs">
              <table className="w-full text-left text-slate-600">
                <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Project & Site</th>
                    <th className="py-3 px-4">Weather</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Workers</th>
                    <th className="py-3 px-4 text-right">Fuel (L)</th>
                    <th className="py-3 px-4 text-right">Materials (ETB)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No daily site reports matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {new Date(r.reportDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{r.project?.projectName}</span>
                          <span className="text-[10px] text-slate-500 block">{r.site?.siteName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <WeatherBadge condition={r.weatherCondition} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <DailyReportStatusBadge status={r.status} />
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                          {r.workersPresent}
                          <span className="text-[10px] text-rose-500 block font-normal">{r.workersAbsent > 0 ? `(${r.workersAbsent} abs)` : ''}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {r.fuelUsedLiters} L
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatCurrency(r.materialsUsedValue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/reports/daily-site/${r.id}`}
                              className="p-1 text-slate-400 hover:text-slate-900 rounded"
                              title="View Report"
                            >
                              <Eye size={15} />
                            </Link>
                            {r.status !== 'Approved' && (
                              <Link
                                href={`/dashboard/reports/daily-site/${r.id}/edit`}
                                className="p-1 text-slate-400 hover:text-slate-900 rounded"
                                title="Edit Report"
                              >
                                <Edit3 size={15} />
                              </Link>
                            )}
                          </div>
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
    </div>
  );
}
