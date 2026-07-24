'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  CheckCircle2,
  XCircle,
  Send,
  Trash2,
  Calendar,
  Building2,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Fuel,
  Users,
  Wrench,
  PackageCheck,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { DailyReportStatusBadge } from '@/components/reports/DailyReportStatusBadge';
import { WeatherBadge } from '@/components/reports/WeatherBadge';
import { formatCurrency } from '@/lib/utils';

interface ReportDetail {
  id: string;
  reportDate: string;
  status: string;
  weatherCondition: string;
  workCompleted: string;
  workPlannedTomorrow?: string;
  issuesOrBlockers?: string;
  safetyIncidents?: string;
  qualityIssues?: string;
  generalNotes?: string;
  workersPresent: number;
  workersAbsent: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  machineryUsedCount: number;
  fuelUsedLiters: number;
  materialsUsedValue: number;
  photos?: string;
  documents?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  project?: { id: string; projectName: string; location?: string };
  site?: { id: string; siteName: string; location?: string };
  submittedBy?: { id: string; firstName: string; lastName: string; email?: string };
  approvedBy?: { id: string; firstName: string; lastName: string };
  machineryRecords?: Array<{
    id: string;
    workingHours: number;
    idleHours: number;
    fuelUsedLiters: number;
    machine?: { brand: string; model: string; plateNumber?: string };
    operator?: { firstName: string; lastName: string };
  }>;
  materialRecords?: Array<{
    id: string;
    quantityUsed: number;
    unit?: string;
    estimatedCost: number;
    inventoryItem?: { itemName: string; itemCode?: string };
  }>;
}

export default function DailyReportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadReport() {
      if (useMockData) {
        setReport({
          id,
          reportDate: new Date().toISOString(),
          status: 'Submitted',
          weatherCondition: 'Sunny',
          workCompleted: 'Excavated 180m underpass trench line, installed 40m PVC drainage piping, and poured 45m3 structural lean concrete.',
          workPlannedTomorrow: 'Cast main retaining wall foundation footings and bind rebar cages.',
          issuesOrBlockers: 'Minor morning traffic jam delayed aggregate dump truck delivery by 45 minutes.',
          safetyIncidents: 'No safety incidents reported today. PPE inspection conducted at 08:30 AM.',
          qualityIssues: 'Concrete slump tests measured 75mm, fully compliant with structural specifications.',
          generalNotes: 'Full crew operating on shift.',
          workersPresent: 14,
          workersAbsent: 1,
          totalRegularHours: 112,
          totalOvertimeHours: 18,
          machineryUsedCount: 2,
          fuelUsedLiters: 450,
          materialsUsedValue: 185000,
          submittedAt: new Date().toISOString(),
          project: { id: 'p-1', projectName: 'Bole Road Expansion', location: 'Bole, Addis Ababa' },
          site: { id: 's-1', siteName: 'Olympia Junction Site', location: 'Olympia' },
          submittedBy: { id: 'u-1', firstName: 'Mekdes', lastName: 'Alemu' },
          machineryRecords: [
            { id: 'mr-1', workingHours: 8, idleHours: 1, fuelUsedLiters: 200, machine: { brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234' }, operator: { firstName: 'Abebe', lastName: 'Kebede' } },
          ],
          materialRecords: [
            { id: 'matr-1', quantityUsed: 200, unit: 'Bag', estimatedCost: 170000, inventoryItem: { itemName: 'Cement 50kg', itemCode: 'MAT-CEM-001' } },
          ],
        });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/reports/daily-site/${id}`);
        if (!res.ok) throw new Error('Daily report record not found');
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Error loading report details');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id, apiUrl, useMockData]);

  const handleSubmitReport = async () => {
    setActionLoading(true);
    setError(null);

    if (useMockData) {
      alert('Demo Mode: Report submitted!');
      setReport((prev) => (prev ? { ...prev, status: 'Submitted' } : null));
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/reports/daily-site/${id}/submit`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to submit report');
      setReport(await res.json());
    } catch (err: any) {
      setError(err.message || 'Error submitting report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    if (useMockData) {
      alert('Demo Mode: Report approved!');
      setReport((prev) => (prev ? { ...prev, status: 'Approved' } : null));
      setShowApproveModal(false);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/reports/daily-site/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalNotes }),
      });

      if (!res.ok) throw new Error('Failed to approve report');
      setReport(await res.json());
      setShowApproveModal(false);
    } catch (err: any) {
      setError(err.message || 'Error approving report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    if (useMockData) {
      alert('Demo Mode: Report rejected!');
      setReport((prev) => (prev ? { ...prev, status: 'Rejected', rejectionReason } : null));
      setShowRejectModal(false);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/reports/daily-site/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });

      if (!res.ok) throw new Error('Failed to reject report');
      setReport(await res.json());
      setShowRejectModal(false);
    } catch (err: any) {
      setError(err.message || 'Error rejecting report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this daily site report?')) return;
    setActionLoading(true);

    if (useMockData) {
      alert('Demo Mode: Report deleted!');
      router.push('/dashboard/reports/daily-site');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/reports/daily-site/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete report');
      router.push('/dashboard/reports/daily-site');
    } catch (err: any) {
      setError(err.message || 'Error deleting report');
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading daily site report details..." />;

  if (error || !report) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Daily Report Not Found'}</div>
        <Link href="/dashboard/reports/daily-site" className="text-xs text-[#0284c7] underline font-semibold">
          Return to Daily Site Reports Dashboard
        </Link>
      </div>
    );
  }

  const photosList = report.photos ? JSON.parse(report.photos) : [];
  const docsList = report.documents ? JSON.parse(report.documents) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports/daily-site" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Daily Report: {new Date(report.reportDate).toLocaleDateString()}
              </h2>
              <DailyReportStatusBadge status={report.status} />
              <WeatherBadge condition={report.weatherCondition} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Project: {report.project?.projectName} • Site: {report.site?.siteName}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-2">
          {report.status !== 'Approved' && (
            <Link
              href={`/dashboard/reports/daily-site/${report.id}/edit`}
              className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs"
            >
              <Edit3 size={15} />
              Edit
            </Link>
          )}

          {report.status === 'Draft' && (
            <button
              onClick={handleSubmitReport}
              disabled={actionLoading}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-md text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <Send size={15} />
              Submit Report
            </button>
          )}

          {report.status === 'Submitted' && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-md text-xs font-bold disabled:opacity-50"
              >
                <XCircle size={15} />
                Reject
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                Approve
              </button>
            </>
          )}

          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-md"
            title="Delete Report"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Resource KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-xs p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Workers On Site</span>
          <div className="text-xl font-black text-slate-900 mt-1">{report.workersPresent} Present</div>
          <span className="text-[10px] text-slate-500">{report.totalRegularHours}h Reg + {report.totalOvertimeHours}h OT</span>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Machinery Count</span>
          <div className="text-xl font-black text-slate-900 mt-1">{report.machineryUsedCount} Units</div>
          <span className="text-[10px] text-slate-500">Active on site shift</span>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Fuel Consumed</span>
          <div className="text-xl font-black text-slate-900 mt-1">{report.fuelUsedLiters} Liters</div>
          <span className="text-[10px] text-slate-500">Dispensed for shift</span>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Materials Cost Value</span>
          <div className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(report.materialsUsedValue)}</div>
          <span className="text-[10px] text-slate-500">Materials issued to plot</span>
        </Card>
      </div>

      {/* Main Content Cards */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Work Progress & Site Observations</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-xs text-slate-700">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Work Accomplished Today</span>
            <p className="mt-1 text-slate-900 font-semibold leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
              {report.workCompleted}
            </p>
          </div>

          {report.workPlannedTomorrow && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Work Planned Tomorrow</span>
              <p className="mt-1 text-slate-800 leading-relaxed bg-slate-50/50 p-3 rounded-md border border-slate-100">
                {report.workPlannedTomorrow}
              </p>
            </div>
          )}

          {report.issuesOrBlockers && (
            <div>
              <span className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
                <AlertTriangle size={12} />
                Issues & Blockers
              </span>
              <p className="mt-1 text-rose-900 font-semibold leading-relaxed bg-rose-50 p-3 rounded-md border border-rose-200">
                {report.issuesOrBlockers}
              </p>
            </div>
          )}

          {report.safetyIncidents && (
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
                <ShieldCheck size={12} />
                Safety Incidents / PPE
              </span>
              <p className="mt-1 text-amber-900 leading-relaxed bg-amber-50 p-3 rounded-md border border-amber-200">
                {report.safetyIncidents}
              </p>
            </div>
          )}

          {report.rejectionReason && (
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase block">Rejection Rationale</span>
              <p className="mt-1 text-rose-900 font-bold bg-rose-50 p-3 rounded-md border border-rose-200">
                {report.rejectionReason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Machinery Detail Breakdown */}
      {report.machineryRecords && report.machineryRecords.length > 0 && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Operated Heavy Equipment</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            <table className="w-full text-left text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Machine</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4 text-right">Working Hours</th>
                  <th className="py-3 px-4 text-right">Idle Hours</th>
                  <th className="py-3 px-4 text-right">Fuel Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.machineryRecords.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {m.machine ? `${m.machine.brand} ${m.machine.model}` : 'Machine'}
                      <span className="text-[10px] font-mono text-slate-400 block">{m.machine?.plateNumber}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {m.operator ? `${m.operator.firstName} ${m.operator.lastName}` : 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">{m.workingHours}h</td>
                    <td className="py-3 px-4 text-right text-slate-400">{m.idleHours}h</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">{m.fuelUsedLiters} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Material Detail Breakdown */}
      {report.materialRecords && report.materialRecords.length > 0 && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Consumed Materials</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            <table className="w-full text-left text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Material Item</th>
                  <th className="py-3 px-4 text-right">Quantity Used</th>
                  <th className="py-3 px-4 text-right">Estimated Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.materialRecords.map((mat) => (
                  <tr key={mat.id}>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {mat.inventoryItem?.itemName}
                      <span className="text-[10px] font-mono text-slate-400 block">{mat.inventoryItem?.itemCode}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">{mat.quantityUsed} {mat.unit || ''}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatCurrency(mat.estimatedCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Photo & Document Attachments */}
      {(photosList.length > 0 || docsList.length > 0) && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Photos & Attachments</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            {photosList.map((url: string, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
                <span className="font-semibold text-slate-800">{url}</span>
                <a href={url} target="_blank" rel="noreferrer" className="text-[#0284c7] font-bold hover:underline">
                  View Photo
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Approve Daily Site Report</h3>
            <p className="text-xs text-slate-500">Approve daily report for site record locking and executive dashboard metrics.</p>
            <form onSubmit={handleApprove} className="space-y-4 text-xs">
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Optional approval comments..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-900"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Reject Daily Site Report</h3>
            <p className="text-xs text-slate-500">State clear rejection rationale for the site manager to correct and resubmit.</p>
            <form onSubmit={handleReject} className="space-y-4 text-xs">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Missing concrete cube test log or worker headcount mismatch..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-rose-500 text-slate-900"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
