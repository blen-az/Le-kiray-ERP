'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Calendar, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  Briefcase, 
  User 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PermissionGate } from '@/components/auth/RequirePermission';
import { apiFetch } from '@/lib/api';

interface Site {
  id: string;
  siteName: string;
  location: string;
}

interface ProjectManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Project {
  id: string;
  projectName: string;
  projectCode: string | null;
  clientName: string | null;
  location: string;
  regionOrCity: string | null;
  status: string;
  progressPercentage: number;
  budget: number;
  startDate: string | null;
  endDate: string | null;
  projectManagerId: string | null;
  projectManager: ProjectManager | null;
  sites: Site[];
}

const fallbackProjects: Project[] = [
  {
    id: 'p-1',
    projectName: 'Bole Road Expansion',
    projectCode: 'PRJ-BOLE-001',
    clientName: 'Addis Ababa City Administration',
    location: 'Bole, Addis Ababa',
    regionOrCity: 'Addis Ababa',
    status: 'Active',
    progressPercentage: 68,
    budget: 45000000.0,
    startDate: new Date('2025-01-10').toISOString(),
    endDate: new Date('2026-03-15').toISOString(),
    projectManagerId: 'pm-1',
    projectManager: { id: 'pm-1', firstName: 'Daniel', lastName: 'Solomon', email: 'daniel@abccomp.com' },
    sites: [
      { id: 's-1', siteName: 'Bole Main Excavation Site', location: 'Bole Olympia' },
      { id: 's-2', siteName: 'Rwanda Traffic Circle Site', location: 'Bole Rwanda' },
    ],
  },
  {
    id: 'p-2',
    projectName: 'Hawassa Housing Project',
    projectCode: 'PRJ-HAW-002',
    clientName: 'Federal Housing Corporation',
    location: 'Hawassa town center',
    regionOrCity: 'Sidama Region',
    status: 'On Track',
    progressPercentage: 35,
    budget: 85000000.0,
    startDate: new Date('2025-05-15').toISOString(),
    endDate: new Date('2027-02-28').toISOString(),
    projectManagerId: 'pm-2',
    projectManager: { id: 'pm-2', firstName: 'Kerealem', lastName: 'Lemma', email: 'kerealem@abccomp.com' },
    sites: [
      { id: 's-3', siteName: 'Hawassa Block A Residential Site', location: 'Hawassa Lakeside' },
    ],
  },
  {
    id: 'p-3',
    projectName: 'Dire Dawa Water Pipeline',
    projectCode: 'PRJ-DIR-003',
    clientName: 'Ministry of Water and Energy',
    location: 'Dire Dawa outskirts',
    regionOrCity: 'Dire Dawa',
    status: 'Delayed',
    progressPercentage: 12,
    budget: 120000000.0,
    startDate: new Date('2025-09-01').toISOString(),
    endDate: new Date('2026-11-30').toISOString(),
    projectManagerId: 'pm-1',
    projectManager: { id: 'pm-1', firstName: 'Daniel', lastName: 'Solomon', email: 'daniel@abccomp.com' },
    sites: [],
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [managerFilter, setManagerFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function fetchProjects() {
      if (useMockData) {
        setProjects(fallbackProjects);
        setUsingMock(true);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/projects`);
        if (!res.ok) throw new Error('Failed to retrieve projects from backend service');
        const data = await res.json();
        setProjects(data);
        setUsingMock(false);
        setError(null);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Could not connect to ERP server');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [useMockData, apiUrl]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? All associated sites will be soft-deleted.')) return;

    if (usingMock) {
      setProjects(projects.filter(p => p.id !== id));
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project from server');
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting project');
    }
  };

  // Collect unique managers for drop down filter
  const uniqueManagers = Array.from(
    new Map(
      projects
        .filter((p) => p.projectManager !== null && p.projectManager !== undefined)
        .map((p) => [p.projectManager!.id, p.projectManager!])
    ).values()
  );

  // Apply filters
  const filteredProjects = projects.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.projectName.toLowerCase().includes(term) ||
      (p.projectCode && p.projectCode.toLowerCase().includes(term)) ||
      (p.clientName && p.clientName.toLowerCase().includes(term)) ||
      p.location.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesManager = managerFilter === 'ALL' || p.projectManagerId === managerFilter;

    return matchesSearch && matchesStatus && matchesManager;
  });

  if (loading) {
    return <LoadingState message="Loading projects and sites catalog..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects & Sites"
        description="Register and coordinate your company construction projects and physical sites."
        actions={
          <PermissionGate permission="projects:create">
            <Link
              href="/dashboard/projects/new"
              className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus size={16} />
              New Project
            </Link>
          </PermissionGate>
        }
      />

      {/* Filters block */}
      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search project name, code, client, or site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0284c7] text-slate-700 bg-white"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto self-end md:self-auto">
            <div className="flex flex-col gap-1 w-1/2 md:w-44">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 border border-slate-200 rounded-md text-xs bg-white text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
                <option value="Suspended">Suspended</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 w-1/2 md:w-48">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Manager</label>
              <select
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                className="py-1.5 px-3 border border-slate-200 rounded-md text-xs bg-white text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Managers</option>
                {uniqueManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<Building2 size={40} />}
          title="No Projects Found"
          description={
            search || statusFilter !== 'ALL' || managerFilter !== 'ALL'
              ? 'No projects matching your active search filters were found. Try adjusting parameters.'
              : 'Add your first construction project contract to start tracking sites, materials, and heavy machinery.'
          }
          action={
            !search && statusFilter === 'ALL' && managerFilter === 'ALL' ? (
              <Link
                href="/dashboard/projects/new"
                className="bg-[#0284c7] hover:bg-[#0275b0] text-white px-3 py-1.5 rounded-md text-xs font-semibold"
              >
                Create Project
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card className="border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Project Details</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Budget (ETB)</th>
                  <th className="py-3 px-4">Status & Progress</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4 text-center">Sites</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="bg-sky-50 text-[#0284c7] p-2 rounded-md shrink-0 mt-0.5">
                          <Briefcase size={16} />
                        </div>
                        <div>
                          <Link href={`/dashboard/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-[#0284c7] transition-colors">
                            {p.projectName}
                          </Link>
                          <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-0.5">
                            <span>{p.projectCode || 'No Code'}</span>
                            <span>•</span>
                            <span>{p.clientName || 'Private Client'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span>{p.location}</span>
                      </div>
                      {p.regionOrCity && <span className="text-[10px] text-slate-400 block ml-4">{p.regionOrCity}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatCurrency(p.budget)}
                    </td>
                    <td className="py-3.5 px-4 max-w-[150px]">
                      <div className="mb-1">
                        <StatusBadge status={p.status} />
                      </div>
                      <ProgressBar value={p.progressPercentage} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{p.startDate ? formatDate(p.startDate) : 'TBD'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-5">
                        to {p.endDate ? formatDate(p.endDate) : 'TBD'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.projectManager ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#0f172a] text-white text-[10px] font-bold flex items-center justify-center">
                            {p.projectManager.firstName[0]}
                          </div>
                          <span>
                            {p.projectManager.firstName} {p.projectManager.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-[10px]">
                        {p.sites?.length || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/projects/${p.id}`}
                          title="View Details"
                          className="p-1 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                        <PermissionGate permission="projects:update">
                          <Link
                            href={`/dashboard/projects/${p.id}/edit`}
                            title="Edit Project"
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          >
                            <Edit3 size={16} />
                          </Link>
                        </PermissionGate>
                        <PermissionGate permission="projects:delete">
                          <button
                            onClick={() => handleDelete(p.id)}
                            title="Delete Project"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
