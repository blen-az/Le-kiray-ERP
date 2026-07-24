'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Building2,
  MapPin,
  User,
  Plus,
  FileCheck2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { DailyReportStatusBadge } from '@/components/reports/DailyReportStatusBadge';

interface SiteComplianceItem {
  siteId: string;
  siteName: string;
  projectId: string;
  projectName?: string;
  siteManager?: string;
  hasSubmittedToday: boolean;
  reportId?: string;
  status: string;
  issuesOrBlockers?: string;
  safetyIncidents?: string;
}

interface TodaySummary {
  date: string;
  totalActiveSites: number;
  submittedCount: number;
  missingCount: number;
  blockersCount: number;
  safetyIncidentsCount: number;
  sites: SiteComplianceItem[];
}

const fallbackTodaySummary: TodaySummary = {
  date: new Date().toISOString().slice(0, 10),
  totalActiveSites: 3,
  submittedCount: 2,
  missingCount: 1,
  blockersCount: 1,
  safetyIncidentsCount: 0,
  sites: [
    {
      siteId: 's-1',
      siteName: 'Olympia Junction Site',
      projectId: 'p-1',
      projectName: 'Bole Road Expansion',
      siteManager: 'Mekdes Alemu',
      hasSubmittedToday: true,
      reportId: 'rep-1',
      status: 'Approved',
      issuesOrBlockers: 'Minor morning traffic jam.',
    },
    {
      siteId: 's-3',
      siteName: 'Hawassa Lake Side site',
      projectId: 'p-2',
      projectName: 'Hawassa Housing Project',
      siteManager: 'Mekdes Alemu',
      hasSubmittedToday: true,
      reportId: 'rep-2',
      status: 'Submitted',
      issuesOrBlockers: 'Material Shortage: Pending 16mm rebar.',
    },
    {
      siteId: 's-4',
      siteName: 'Ganda Site A',
      projectId: 'p-3',
      projectName: 'Dire Dawa Water Pipeline',
      siteManager: 'Site Manager',
      hasSubmittedToday: false,
      status: 'Missing',
    },
  ],
};

export default function TodaysSiteReportsPage() {
  const [data, setData] = useState<TodaySummary>(fallbackTodaySummary);
  const [loading, setLoading] = useState(true);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadTodayStatus() {
      if (useMockData) {
        setData(fallbackTodaySummary);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/reports/daily-site/today`);
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        } else {
          setData(fallbackTodaySummary);
        }
      } catch (err) {
        console.error("Error loading today's site report status:", err);
        setData(fallbackTodaySummary);
      } finally {
        setLoading(false);
      }
    }

    loadTodayStatus();
  }, [apiUrl, useMockData]);

  if (loading) return <LoadingState message="Checking today's site reporting compliance across active plots..." />;

  const compliancePercentage = Math.round((data.submittedCount / (data.totalActiveSites || 1)) * 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports/daily-site" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Today's Site Reports Compliance</h2>
            <p className="text-xs text-slate-500">Live operational reporting status for all active construction sites on {data.date}.</p>
          </div>
        </div>

        <Link
          href="/dashboard/reports/daily-site/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          Create Today's Report
        </Link>
      </div>

      {/* Compliance Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-xs p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Rate</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{compliancePercentage}%</div>
            <span className="text-[10px] text-emerald-600 font-semibold">{data.submittedCount} of {data.totalActiveSites} Active Sites Logged</span>
          </div>
          <div className="p-3 bg-sky-50 text-[#0284c7] rounded-lg">
            <FileCheck2 size={22} />
          </div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports Submitted Today</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{data.submittedCount} Reports</div>
            <span className="text-[10px] text-slate-500 font-medium">Recorded on site</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={22} />
          </div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Missing Today's Report</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{data.missingCount} Sites</div>
            <span className="text-[10px] text-rose-500 font-semibold">Requires follow-up</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Clock size={22} />
          </div>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Site Blockers / Incidents</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{data.blockersCount} Blockers</div>
            <span className="text-[10px] text-rose-600 font-semibold">{data.safetyIncidentsCount} Safety warnings</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle size={22} />
          </div>
        </Card>
      </div>

      {/* Sites Compliance Directory */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Active Sites Reporting Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-xs">
          <div className="divide-y divide-slate-100">
            {data.sites.map((site) => (
              <div key={site.siteId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{site.siteName}</span>
                    <DailyReportStatusBadge status={site.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building2 size={13} className="text-slate-400" />
                      {site.projectName}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={13} className="text-slate-400" />
                      Manager: {site.siteManager}
                    </span>
                  </div>

                  {site.issuesOrBlockers && (
                    <p className="mt-1.5 p-2 bg-rose-50 text-rose-900 border border-rose-200 rounded font-medium text-[11px] max-w-2xl">
                      <strong>Blocker:</strong> {site.issuesOrBlockers}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {site.hasSubmittedToday && site.reportId ? (
                    <Link
                      href={`/dashboard/reports/daily-site/${site.reportId}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs transition-colors"
                    >
                      View Report →
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/reports/daily-site/new?projectId=${site.projectId}&siteId=${site.siteId}`}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs shadow-xs transition-colors"
                    >
                      Log Missing Report →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
