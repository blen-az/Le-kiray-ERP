'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User, 
  Plus, 
  Edit3, 
  ArrowLeft,
  Compass,
  FileText,
  Briefcase,
  AlertTriangle,
  Info,
  Clock,
  ListFilter,
  Trash2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Site {
  id: string;
  siteName: string;
  location: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  siteManagerId: string | null;
  siteManager: { firstName: string; lastName: string } | null;
  status: string;
  startDate: string | null;
  notes: string | null;
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
  description: string | null;
  projectManager: { firstName: string; lastName: string; email: string } | null;
  sites: Site[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'machinery' | 'inventory' | 'workers' | 'fuel' | 'reports'>('overview');
  const [usingMock, setUsingMock] = useState(false);
  const [projectMachines, setProjectMachines] = useState<any[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadProject() {
      if (useMockData) {
        setProject({
          id: projectId,
          projectName: 'Bole Road Expansion',
          projectCode: 'PRJ-BOLE-001',
          clientName: 'Addis Ababa City Administration',
          location: 'Bole Road, Addis Ababa',
          regionOrCity: 'Addis Ababa',
          status: 'Active',
          progressPercentage: 68,
          budget: 45000000.0,
          startDate: '2025-01-10',
          endDate: '2026-03-15',
          description: 'Widening of Bole road including new junctions and underpasses to alleviate traffic bottlenecks.',
          projectManager: { firstName: 'Daniel', lastName: 'Solomon', email: 'daniel@abccomp.com' },
          sites: [
            {
              id: 's-1',
              siteName: 'Bole Main Excavation Site',
              location: 'Bole Olympia',
              gpsLatitude: 9.0123,
              gpsLongitude: 38.7456,
              siteManagerId: 'sm-1',
              siteManager: { firstName: 'Abebe', lastName: 'Kebede' },
              status: 'Active',
              startDate: '2025-01-15',
              notes: 'Primary operations base, heavy loader storage compound.',
            },
            {
              id: 's-2',
              siteName: 'Rwanda Traffic Circle Site',
              location: 'Bole Rwanda',
              gpsLatitude: 9.0045,
              gpsLongitude: 38.7512,
              siteManagerId: 'sm-2',
              siteManager: { firstName: 'Almaz', lastName: 'Desta' },
              status: 'Active',
              startDate: '2025-02-01',
              notes: 'Materials dumping compound, concrete mixer setup.',
            }
          ]
        });
        setUsingMock(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/projects/${projectId}`);
        if (!res.ok) throw new Error('Project not found or API endpoint error');
        const data = await res.json();
        setProject(data);
        setUsingMock(false);
        setError(null);
      } catch (err: any) {
        console.error('Fetch Error:', err);
        setError(err.message || 'Could not connect to ERP server');
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [useMockData, apiUrl, projectId]);

  useEffect(() => {
    if (activeTab !== 'machinery') return;
    
    async function loadProjectMachinery() {
      setLoadingMachines(true);
      if (useMockData) {
        setProjectMachines([
          {
            id: 'm-1',
            machineType: 'Excavator',
            brand: 'CAT',
            model: '320D',
            plateNumber: 'ET-3-A1234',
            currentStatus: 'Active',
            currentSite: { siteName: 'Bole Main Excavation Site' },
            currentOperator: { firstName: 'Abebe', lastName: 'Kebede' },
          },
          {
            id: 'm-2',
            machineType: 'Loader',
            brand: 'Volvo',
            model: 'L90',
            plateNumber: 'ET-3-A4321',
            currentStatus: 'Active',
            currentSite: { siteName: 'Rwanda Traffic Circle Site' },
            currentOperator: { firstName: 'Tariku', lastName: 'Mengistu' },
          }
        ]);
        setLoadingMachines(false);
        return;
      }
      
      try {
        const res = await fetch(`${apiUrl}/machinery`);
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter((m: any) => m.currentProjectId === projectId);
          setProjectMachines(filtered);
        }
      } catch (err) {
        console.error('Error fetching project machinery:', err);
      } finally {
        setLoadingMachines(false);
      }
    }
    loadProjectMachinery();
  }, [activeTab, projectId, useMockData, apiUrl]);

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to soft delete this site?')) return;

    if (usingMock) {
      setProject({
        ...project!,
        sites: project!.sites.filter(s => s.id !== siteId)
      });
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/sites/${siteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete site');
      setProject({
        ...project!,
        sites: project!.sites.filter(s => s.id !== siteId)
      });
    } catch (err: any) {
      alert(err.message || 'Error soft-deleting site');
    }
  };

  if (loading) {
    return <LoadingState message="Fetching project workspace details..." />;
  }

  if (error || !project) {
    return <ErrorState message={error || 'Project workspace details could not be loaded.'} />;
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'sites', name: 'Sites (' + (project.sites?.length || 0) + ')' },
    { id: 'machinery', name: 'Machinery' },
    { id: 'inventory', name: 'Inventory' },
    { id: 'workers', name: 'Workers' },
    { id: 'fuel', name: 'Fuel' },
    { id: 'reports', name: 'Daily Reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/projects"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="text-xs text-slate-500 font-medium">Back to Projects Directory</span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/projects/${projectId}/edit`}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Edit3 size={15} />
            Edit Project
          </Link>
          <Link
            href={`/dashboard/projects/${projectId}/sites/new`}
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={15} />
            Add Site
          </Link>
        </div>
      </div>

      {/* Branded Project Header */}
      <Card className="border border-slate-100 shadow-xs overflow-hidden">
        <div className="bg-[#0f172a] p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status={project.status} className="bg-sky-500/10 text-sky-400 border-sky-400/20" />
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">{project.projectCode || 'NO CODE'}</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{project.projectName}</h2>
              <p className="text-xs text-slate-400 mt-1">Client: {project.clientName || 'Private Client'}</p>
            </div>
            
            <div className="w-full md:w-64 bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
              <ProgressBar value={project.progressPercentage} showText />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Location</span>
              <span className="font-semibold mt-1 flex items-center gap-1">
                <MapPin size={13} className="text-sky-400 shrink-0" />
                {project.location}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Budget</span>
              <span className="font-semibold text-sky-400 mt-1 block">
                {formatCurrency(project.budget)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Project Coordinator</span>
              <span className="font-semibold mt-1 flex items-center gap-1">
                <User size={13} className="text-sky-400" />
                {project.projectManager ? `${project.projectManager.firstName} ${project.projectManager.lastName}` : 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Timeline</span>
              <span className="font-semibold mt-1 block">
                {project.startDate ? formatDate(project.startDate) : 'TBD'} to {project.endDate ? formatDate(project.endDate) : 'TBD'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-4 font-bold text-xs shrink-0 border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-[#0284c7] text-[#0284c7]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Active Tab render */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Summary */}
              <Card className="border border-slate-100 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 leading-relaxed space-y-3">
                  <p>{project.description || 'No detailed scope description registered for this project.'}</p>
                </CardContent>
              </Card>

              {/* Sites overview list */}
              <Card className="border border-slate-100 shadow-xs">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Site Compounds</CardTitle>
                  <span className="text-[10px] text-slate-400 font-semibold">{project.sites?.length || 0} Sites</span>
                </CardHeader>
                <CardContent className="p-0">
                  {project.sites?.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">No active site compounds mapped under this contract.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {project.sites.slice(0, 3).map((site) => (
                        <div key={site.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                          <div>
                            <span className="font-semibold text-slate-800">{site.siteName}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{site.location}</span>
                          </div>
                          <StatusBadge status={site.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Metrics Column */}
            <div className="space-y-6">
              <Card className="border border-slate-100 shadow-xs bg-slate-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Contract KPIs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Current Status</span>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Budget Spent</span>
                    <span className="font-semibold text-slate-900">0.00 ETB (0%)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Completed Site Plots</span>
                    <span className="font-bold text-slate-800">
                      {project.sites?.filter(s => s.status === 'Completed').length || 0} / {project.sites?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Risk Level</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      project.status === 'At Risk' || project.status === 'Delayed' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      <Info size={13} />
                      {project.status === 'At Risk' || project.status === 'Delayed' ? 'Elevated' : 'Stable'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Risks Placeholder */}
              <Card className="border border-slate-100 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Risks & Blockers</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-center text-slate-400 py-6">
                  <AlertTriangle className="mx-auto mb-2 text-slate-300" size={24} />
                  No open site blocker alerts logged.
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'sites' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800">Site Compounds List</h3>
              <Link
                href={`/dashboard/projects/${projectId}/sites/new`}
                className="flex items-center gap-1 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus size={14} />
                Add Site
              </Link>
            </div>

            {project.sites?.length === 0 ? (
              <EmptyState
                icon={<Building2 size={36} />}
                title="No Sites Created"
                description="This project doesn't have any site compound plots registered yet."
                action={
                  <Link
                    href={`/dashboard/projects/${projectId}/sites/new`}
                    className="bg-[#0284c7] text-white font-semibold text-xs px-3 py-1.5 rounded"
                  >
                    Add First Site
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.sites.map((site) => (
                  <Card key={site.id} className="border border-slate-100 shadow-xs hover:shadow-sm transition-shadow">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{site.siteName}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1">
                            <MapPin size={11} /> {site.location}
                          </span>
                        </div>
                        <StatusBadge status={site.status} />
                      </div>

                      {/* GPS coords */}
                      {(site.gpsLatitude || site.gpsLongitude) ? (
                        <div className="flex gap-4 p-2 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Compass size={12} className="text-[#0284c7]" /> Lat: {site.gpsLatitude}
                          </span>
                          <span>Lon: {site.gpsLongitude}</span>
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-50/50 border border-dashed border-slate-100 rounded text-[10px] text-slate-400 italic">
                          No GPS coordinates mapped.
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Site Manager</span>
                          <span className="font-medium text-slate-700 block mt-0.5">
                            {site.siteManager ? `${site.siteManager.firstName} ${site.siteManager.lastName}` : 'Unassigned'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Start Date</span>
                          <span className="font-medium text-slate-700 block mt-0.5">
                            {site.startDate ? formatDate(site.startDate) : 'TBD'}
                          </span>
                        </div>
                      </div>

                      {site.notes && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100/50 leading-relaxed">
                          <span className="font-bold block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Notes</span>
                          {site.notes}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Link
                          href={`/dashboard/sites/${site.id}/edit`}
                          className="flex items-center gap-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-[10px] px-2.5 py-1 rounded transition-colors"
                        >
                          <Edit3 size={12} /> Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteSite(site.id)}
                          className="flex items-center gap-1 hover:bg-rose-50 border border-transparent text-slate-400 hover:text-rose-600 font-semibold text-[10px] px-2.5 py-1 rounded transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'machinery' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800">Deployed Machinery & Heavy Equipment</h3>
              <Link
                href={`/dashboard/machinery`}
                className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors"
              >
                Go to Fleet Directory
              </Link>
            </div>

            {loadingMachines ? (
              <div className="text-center py-8 text-xs text-slate-500">Querying deployed fleet...</div>
            ) : projectMachines.length === 0 ? (
              <EmptyState
                icon={<Building2 size={36} />}
                title="No Machinery Assigned"
                description="There are currently no heavy machinery assets deployed to any sites under this contract."
                action={
                  <Link
                    href={`/dashboard/machinery`}
                    className="bg-[#0284c7] text-white font-semibold text-xs px-3 py-1.5 rounded"
                  >
                    Assign Machinery
                  </Link>
                }
              />
            ) : (
              <Card className="border border-slate-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                        <th className="py-3 px-4">Equipment Details</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Site Compound</th>
                        <th className="py-3 px-4">Operator</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectMachines.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{m.brand} {m.model}</div>
                            <div className="text-[10px] text-slate-400 font-medium">Plate: {m.plateNumber || 'No Plate'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-800 uppercase">
                              {m.machineType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {m.currentSite ? m.currentSite.siteName : 'Project compound'}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {m.currentOperator ? (
                              <span className="flex items-center gap-1">
                                <User size={12} className="text-slate-400" />
                                {m.currentOperator.firstName} {m.currentOperator.lastName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize bg-blue-50 text-blue-700 border-blue-200">
                              {m.currentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/dashboard/machinery/${m.id}`}
                              className="text-[#0284c7] hover:underline font-semibold"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Future Connected Modules Placeholders */}
        {['inventory', 'workers', 'reports'].includes(activeTab) && (
          <EmptyState
            icon={<Clock size={40} className="animate-spin text-slate-300" />}
            title="Module Integration Offline"
            description="This module will connect here in the next ERP phase. Site machinery logs, inventory registers, attendance check-ins, and fuel allocations will directly tie back to this project workspace."
          />
        )}

        {activeTab === 'fuel' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Project Fuel Activity</h3>
                <p className="text-xs text-slate-500 mt-0.5">All fuel requests and diesel logs linked to this project.</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/fuel`}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50"
                >
                  View All Requests
                </Link>
                <Link
                  href="/dashboard/fuel/requests/new"
                  className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                >
                  <Plus size={14} />
                  New Fuel Request
                </Link>
              </div>
            </div>

            <Card className="border border-slate-100 shadow-xs">
              <CardContent className="pt-5 space-y-4">
                <p className="text-xs text-slate-600">
                  Track fuel requests, approvals, and diesel issuances across all site compounds for <span className="font-bold">{project.projectName}</span>.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Fuel Requests</span>
                    <Link href="/dashboard/fuel" className="text-xl font-extrabold text-[#0284c7] hover:underline block">View →</Link>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Fuel Logs</span>
                    <Link href="/dashboard/fuel/logs" className="text-xl font-extrabold text-[#0284c7] hover:underline block">View →</Link>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Cost Reports</span>
                    <Link href="/dashboard/fuel/reports" className="text-xl font-extrabold text-[#0284c7] hover:underline block">View →</Link>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                  Full project-scoped fuel filtering is available on the Fuel Management module. The dedicated fuel portal can be filtered by project, site, machine, and operator.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
