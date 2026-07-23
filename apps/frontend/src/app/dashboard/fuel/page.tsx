'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MapPin, 
  User, 
  Calendar, 
  Droplet, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  BarChart4
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { 
  FuelStatusBadge, 
  FuelPriorityBadge, 
  FuelRequestTable, 
  FuelLogTable 
} from '@/components/ui/fuel-components';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface Machine {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
}

interface Project {
  id: string;
  projectName: string;
}

interface Site {
  id: string;
  siteName: string;
}

interface FuelRequest {
  id: string;
  projectId: string;
  project: Project;
  siteId: string;
  site: Site;
  machineId: string;
  machine: Machine;
  operatorId: string;
  operator: { firstName: string; lastName: string };
  litersRequested: number;
  litersApproved: number;
  litersIssued: number;
  costPerLiter: number | null;
  totalCost: number | null;
  status: string;
  priority: string;
  requestDate: string;
  createdAt: string;
}

interface FuelLog {
  id: string;
  usageDate: string;
  machine: Machine;
  operator: { firstName: string; lastName: string } | null;
  site: Site;
  project: Project;
  litersUsed: number;
  costPerLiter: number;
  totalCost: number;
  workingHours: number;
}

export default function FuelDashboardPage() {
  const [requests, setRequests] = useState<FuelRequest[]>([]);
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [summary, setSummary] = useState({ totalCost: 0, totalLiters: 0, averageCost: 0, pendingRequestsCount: 0 });
  const [projectData, setProjectData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Modals state
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'issue' | null>(null);

  // Form states for modals
  const [litersApproved, setLitersApproved] = useState(0);
  const [costPerLiter, setCostPerLiter] = useState(110.50);
  const [rejectionReason, setRejectionReason] = useState('');
  const [litersIssued, setLitersIssued] = useState(0);
  const [workingHours, setWorkingHours] = useState(0);
  const [reading, setReading] = useState(0);
  const [notes, setNotes] = useState('');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const loadDashboard = async () => {
    if (useMockData) {
      setUsingMock(true);
      // Fallback Seed Data
      const mockReqs: FuelRequest[] = [
        {
          id: 'req-1',
          projectId: 'p-1',
          project: { id: 'p-1', projectName: 'Bole Road Expansion' },
          siteId: 's-1',
          site: { id: 's-1', siteName: 'Olympia Junction Site' },
          machineId: 'm-1',
          machine: { id: 'm-1', brand: 'CAT', model: '320D', plateNumber: 'ET-3-A1234' },
          operatorId: 'emp-1',
          operator: { firstName: 'Abebe', lastName: 'Kebede' },
          litersRequested: 200,
          litersApproved: 200,
          litersIssued: 200,
          costPerLiter: 110.50,
          totalCost: 22100.0,
          status: 'Issued',
          priority: 'High',
          requestDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: 'req-2',
          projectId: 'p-2',
          project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
          siteId: 's-3',
          site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
          machineId: 'm-2',
          machine: { id: 'm-2', brand: 'Volvo', model: 'L90', plateNumber: 'ET-3-A4321' },
          operatorId: 'emp-2',
          operator: { firstName: 'Tariku', lastName: 'Mengistu' },
          litersRequested: 150,
          litersApproved: 150,
          litersIssued: 0,
          costPerLiter: 110.50,
          totalCost: 16575.0,
          status: 'Approved',
          priority: 'Normal',
          requestDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: 'req-3',
          projectId: 'p-3',
          project: { id: 'p-3', projectName: 'Dire Dawa Water Pipeline' },
          siteId: 's-4',
          site: { id: 's-4', siteName: 'Ganda Site A' },
          machineId: 'm-3',
          machine: { id: 'm-3', brand: 'Sinotruk', model: 'Howo 371', plateNumber: 'ET-3-A8765' },
          operatorId: 'emp-3',
          operator: { firstName: 'Kassa', lastName: 'Tessema' },
          litersRequested: 250,
          litersApproved: 0,
          litersIssued: 0,
          costPerLiter: null,
          totalCost: null,
          status: 'Pending',
          priority: 'Urgent',
          requestDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }
      ];
      const mockLogs: FuelLog[] = [
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
        }
      ];

      setRequests(mockReqs);
      setLogs(mockLogs);
      setSummary({ totalCost: 35360, totalLiters: 320, averageCost: 110.50, pendingRequestsCount: 1 });
      setProjectData([
        { projectName: 'Bole Road Expansion', cost: 35360 },
        { projectName: 'Hawassa Housing Project', cost: 0 },
        { projectName: 'Dire Dawa Pipeline', cost: 0 },
      ]);
      setLoading(false);
      return;
    }

    try {
      const [reqRes, logsRes, summaryRes, projRes] = await Promise.all([
        fetch(`${apiUrl}/fuel/requests`),
        fetch(`${apiUrl}/fuel/logs`),
        fetch(`${apiUrl}/fuel/reports/summary`),
        fetch(`${apiUrl}/fuel/reports/by-project`),
      ]);

      if (reqRes.ok) setRequests(await reqRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (projRes.ok) setProjectData(await projRes.json());

      setUsingMock(false);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error querying fuel metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [useMockData, apiUrl]);

  // Modal actions
  const openApprove = (id: string) => {
    const r = requests.find((x) => x.id === id);
    if (!r) return;
    setLitersApproved(r.litersRequested);
    setCostPerLiter(110.50);
    setNotes('');
    setActiveRequestId(id);
    setModalType('approve');
  };

  const openReject = (id: string) => {
    setRejectionReason('');
    setActiveRequestId(id);
    setModalType('reject');
  };

  const openIssue = (id: string) => {
    const r = requests.find((x) => x.id === id);
    if (!r) return;
    setLitersIssued(r.litersApproved - r.litersIssued);
    setWorkingHours(8);
    setReading(0);
    setNotes('');
    setActiveRequestId(id);
    setModalType('issue');
  };

  const handleApproveSubmit = async () => {
    if (usingMock) {
      alert('Mock Mode: Request approved!');
      setRequests(requests.map((r) => r.id === activeRequestId ? { ...r, status: 'Approved', litersApproved, costPerLiter } : r));
      setModalType(null);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/fuel/requests/${activeRequestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ litersApproved, costPerLiter, notes }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Approval failed');
      }
      setModalType(null);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Error approving request');
    }
  };

  const handleRejectSubmit = async () => {
    if (usingMock) {
      alert('Mock Mode: Request rejected!');
      setRequests(requests.map((r) => r.id === activeRequestId ? { ...r, status: 'Rejected', rejectionReason } : r));
      setModalType(null);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/fuel/requests/${activeRequestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!res.ok) throw new Error('Rejection failed');
      setModalType(null);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Error rejecting request');
    }
  };

  const handleIssueSubmit = async () => {
    if (usingMock) {
      alert('Mock Mode: Fuel issued & log generated!');
      setRequests(requests.map((r) => r.id === activeRequestId ? { ...r, status: 'Issued', litersIssued } : r));
      setModalType(null);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/fuel/requests/${activeRequestId}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          litersIssued,
          usageDate: new Date().toISOString().split('T')[0],
          workingHours,
          odometerOrHourMeterReading: reading || undefined,
          notes,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Issuance failed');
      }
      setModalType(null);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Error issuing fuel');
    }
  };

  const uniqueProjects = Array.from(new Map(requests.map((r) => [r.projectId, r.project])).values());

  const filteredRequests = requests.filter((r) => {
    const term = search.toLowerCase();
    const matchesSearch =
      r.project?.projectName?.toLowerCase().includes(term) ||
      r.site?.siteName?.toLowerCase().includes(term) ||
      (r.machine && `${r.machine.brand} ${r.machine.model}`.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesProject = projectFilter === 'ALL' || r.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  if (loading) {
    return <LoadingState message="Loading fuel control dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Approve Modal */}
      {modalType === 'approve' && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="max-w-md w-full border border-slate-100 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#0284c7]" />
                Approve Fuel Request
              </CardTitle>
              <CardDescription>Verify approved diesel quantity and log unit price.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700">Liters Approved *</label>
                  <input
                    type="number"
                    value={litersApproved}
                    onChange={(e) => setLitersApproved(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-md outline-none bg-white text-slate-700"
                  />
                </div>
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700">Cost Per Liter (ETB) *</label>
                  <input
                    type="number"
                    value={costPerLiter}
                    onChange={(e) => setCostPerLiter(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-md outline-none bg-white text-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700">Approval notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-md outline-none bg-white text-slate-700 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModalType(null)} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-md">Cancel</button>
                <button onClick={handleApproveSubmit} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md">Approve Request</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {modalType === 'reject' && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="max-w-md w-full border border-slate-100 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <XCircle size={16} className="text-rose-600" />
                Reject Fuel Request
              </CardTitle>
              <CardDescription>Please log the rejection reason below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700">Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-md outline-none bg-white text-slate-700 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModalType(null)} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-md">Cancel</button>
                <button onClick={handleRejectSubmit} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md">Reject Request</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issue Modal */}
      {modalType === 'issue' && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="max-w-md w-full border border-slate-100 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-[#0284c7]" />
                Issue Diesel Fuel
              </CardTitle>
              <CardDescription>Confirm dispatch quantity and update machinery logs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700">Liters Issued *</label>
                  <input
                    type="number"
                    value={litersIssued}
                    onChange={(e) => setLitersIssued(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-md outline-none bg-white text-slate-700"
                  />
                </div>
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700">Hour Meter Reading</label>
                  <input
                    type="number"
                    value={reading}
                    onChange={(e) => setReading(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-md outline-none bg-white text-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700">Machine Work Hours Logged</label>
                <input
                  type="number"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(parseFloat(e.target.value) || 0)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-md outline-none bg-white text-slate-700"
                />
              </div>
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-md outline-none bg-white text-slate-700 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModalType(null)} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-md">Cancel</button>
                <button onClick={handleIssueSubmit} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md">Issue Fuel</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Fuel Management"
        description="Submit fuel requests, approve site allocations, and log machinery diesel consumption."
        actions={
          <div className="flex gap-2">
            <Link
              href="/dashboard/fuel/logs"
              className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
            >
              Fuel Usage Logs
            </Link>
            <Link
              href="/dashboard/fuel/reports"
              className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
            >
              Fuel Reports
            </Link>
            <Link
              href="/dashboard/fuel/requests/new"
              className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus size={16} />
              Create Fuel Request
            </Link>
          </div>
        }
      />

      {/* Warnings Panel */}
      {summary.totalCost > 50000 && (
        <div className="p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-xs font-medium flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="text-orange-600 shrink-0 mt-0.5" size={16} />
          <div>
            <span className="font-bold block">Elevated Monthly Fuel Consumption Warning</span>
            <span className="text-[11px] text-orange-700/90 block mt-0.5">
              Warning: Fuel usage has exceeded the normal monthly threshold of 50,000 ETB. Current cost: {formatCurrency(summary.totalCost)}.
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Fuel Cost</span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">{formatCurrency(summary.totalCost)}</h3>
            </div>
            <div className="bg-sky-50 text-[#0284c7] p-2 rounded-lg">
              <DollarSign size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diesel Issued (Month)</span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">{summary.totalLiters} Liters</h3>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
              <Droplet size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
              <h3 className="text-lg font-extrabold text-amber-600 mt-1">{summary.pendingRequestsCount} Requests</h3>
            </div>
            <div className="bg-amber-50 text-amber-600 p-2 rounded-lg">
              <Clock size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Cost / Liter</span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">{formatCurrency(summary.averageCost)}</h3>
            </div>
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      {projectData.length > 0 && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart4 size={15} className="text-[#0284c7]" />
              Fuel Costs by Project (ETB)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="projectName" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => `${value} ETB`} contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                  <Bar dataKey="cost" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Directory */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-50">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">Active Fuel Requests</CardTitle>
            <CardDescription>Track status, approve fuel amounts, and authorize site dispatches.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="relative">
              <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                <Search size={13} />
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0284c7] text-slate-700 bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2.5 border border-slate-200 rounded-md bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Issued">Issued</option>
              <option value="Partially Issued">Partially Issued</option>
            </select>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="py-1 px-2.5 border border-slate-200 rounded-md bg-white text-slate-700"
            >
              <option value="ALL">All Projects</option>
              {uniqueProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <EmptyState
              icon={<Droplet size={36} className="text-slate-300" />}
              title="No Fuel Requests Found"
              description="Create a new fuel request to begin logging diesel issuance."
            />
          ) : (
            <FuelRequestTable 
              requests={filteredRequests} 
              onApprove={openApprove}
              onReject={openReject}
              onIssue={openIssue}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
