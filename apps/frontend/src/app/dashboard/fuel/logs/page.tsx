'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Droplet } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FuelLogTable } from '@/components/ui/fuel-components';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

export default function FuelLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    const loadLogs = async () => {
      if (useMockData) {
        setLogs([
          {
            id: 'log-1',
            usageDate: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
            machine: { id: 'm-1', brand: 'CAT', model: '320D', plateNumber: 'ET-3-A1234' },
            operator: { firstName: 'Abebe', lastName: 'Kebede' },
            site: { id: 's-1', siteName: 'Olympia Junction Site' },
            project: { id: 'p-1', projectName: 'Bole Road Expansion' },
            litersUsed: 200,
            costPerLiter: 110.50,
            totalCost: 22100.0,
            workingHours: 8.0,
          },
          {
            id: 'log-2',
            usageDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            machine: { id: 'm-2', brand: 'Volvo', model: 'L90', plateNumber: 'ET-3-A4321' },
            operator: { firstName: 'Tariku', lastName: 'Mengistu' },
            site: { id: 's-2', siteName: 'Rwanda Traffic Circle Site' },
            project: { id: 'p-1', projectName: 'Bole Road Expansion' },
            litersUsed: 120,
            costPerLiter: 110.50,
            totalCost: 13260.00,
            workingHours: 6.5,
          },
        ]);
        setLoading(false);
        return;
      }
      try {
        const res = await apiFetch(`${apiUrl}/fuel/logs`);
        if (!res.ok) throw new Error('Failed to load fuel logs');
        setLogs(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [useMockData, apiUrl]);

  const uniqueProjects = Array.from(
    new Map(logs.map(l => [l.project?.id, l.project])).values()
  ).filter(Boolean);

  const filtered = logs.filter(l => {
    const term = search.toLowerCase();
    const matchSearch =
      `${l.machine?.brand} ${l.machine?.model}`.toLowerCase().includes(term) ||
      l.site?.siteName?.toLowerCase().includes(term) ||
      l.project?.projectName?.toLowerCase().includes(term) ||
      (l.operator && `${l.operator.firstName} ${l.operator.lastName}`.toLowerCase().includes(term));
    const matchProject = projectFilter === 'ALL' || l.project?.id === projectFilter;
    return matchSearch && matchProject;
  });

  const totalLiters = filtered.reduce((s, l) => s + l.litersUsed, 0);
  const totalCost = filtered.reduce((s, l) => s + l.totalCost, 0);

  if (loading) return <LoadingState message="Loading fuel usage logs..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel Usage Logs"
        description="Full audit record of all diesel dispenses linked to machinery assets."
        actions={
          <Link
            href="/dashboard/fuel/requests/new"
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={15} />
            New Fuel Request
          </Link>
        }
      />

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Liters Logged</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalLiters.toFixed(1)} L</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
              <Droplet size={18} />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Fuel Cost</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalCost)}</p>
            </div>
            <div className="bg-sky-50 text-[#0284c7] p-2 rounded-lg">
              <Droplet size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-50">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">All Fuel Logs ({filtered.length})</CardTitle>
            <CardDescription>Search, filter and audit all diesel issuance records.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="relative">
              <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                <Search size={13} />
              </span>
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
              />
            </div>
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="py-1.5 px-2.5 border border-slate-200 rounded-md bg-white text-slate-700"
            >
              <option value="ALL">All Projects</option>
              {uniqueProjects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Droplet size={36} className="text-slate-300" />}
              title="No Fuel Logs Found"
              description="Fuel logs are created when requests are issued or manually logged."
            />
          ) : (
            <FuelLogTable logs={filtered} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
