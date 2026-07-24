'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  Play,
  CheckCircle2,
  XCircle,
  Trash2,
  Wrench,
  Clock,
  Calendar,
  DollarSign,
  PackageCheck,
  User,
  Building2,
  MapPin,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { MaintenanceStatusBadge } from '@/components/maintenance/MaintenanceStatusBadge';
import { MaintenancePriorityBadge } from '@/components/maintenance/MaintenancePriorityBadge';
import { MaintenanceTypeBadge } from '@/components/maintenance/MaintenanceTypeBadge';
import { formatCurrency } from '@/lib/utils';

interface MaintenanceDetail {
  id: string;
  reportedDate: string;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  nextServiceDate?: string;
  maintenanceType: string;
  status: string;
  priority: string;
  issueTitle: string;
  issueDescription?: string;
  diagnosis?: string;
  workPerformed?: string;
  partsUsedValue: number;
  laborCost: number;
  externalServiceCost: number;
  totalCost: number;
  downtimeHours: number;
  odometerOrHourMeterReading?: number;
  notes?: string;
  machine?: { id: string; brand: string; model: string; plateNumber?: string; machineType?: string; currentStatus?: string };
  project?: { id: string; projectName: string; location?: string };
  site?: { id: string; siteName: string; location?: string };
  reportedBy?: { id: string; firstName: string; lastName: string; email?: string };
  assignedMechanic?: { id: string; firstName: string; lastName: string; position?: string; phone?: string };
  partsUsed?: Array<{
    id: string;
    quantityUsed: number;
    unitCost: number;
    totalCost: number;
    notes?: string;
    inventoryItem?: { itemName: string; itemCode?: string };
  }>;
}

export default function MaintenanceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [record, setRecord] = useState<MaintenanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Complete Form Fields
  const [compDiagnosis, setCompDiagnosis] = useState('');
  const [compWorkPerformed, setCompWorkPerformed] = useState('');
  const [compLaborCost, setCompLaborCost] = useState('0');
  const [compExtCost, setCompExtCost] = useState('0');
  const [compDowntime, setCompDowntime] = useState('0');
  const [compNextService, setCompNextService] = useState('');

  // Cancel Reason
  const [cancelReason, setCancelReason] = useState('');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadRecord() {
      if (useMockData) {
        setRecord({
          id,
          reportedDate: new Date(Date.now() - 86400000).toISOString(),
          scheduledDate: new Date(Date.now() - 86400000).toISOString(),
          startedAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
          maintenanceType: 'Breakdown Repair',
          status: 'In Progress',
          priority: 'Urgent',
          issueTitle: 'Hydraulic Cylinder Oil Leak',
          issueDescription: 'Main excavation boom cylinder leaking high-pressure hydraulic fluid during digging loop.',
          diagnosis: 'Blown main boom piston rod seal gasket.',
          workPerformed: 'Disassembled boom cylinder and prepared new seal kit.',
          partsUsedValue: 14500,
          laborCost: 3500,
          externalServiceCost: 0,
          totalCost: 18000,
          downtimeHours: 5.5,
          odometerOrHourMeterReading: 4250.0,
          notes: 'Urgent repair on Bole Road underpass corridor.',
          machine: { id: 'm-1', brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234', machineType: 'Excavator', currentStatus: 'Under Maintenance' },
          project: { id: 'p-1', projectName: 'Bole Road Expansion', location: 'Bole, Addis Ababa' },
          site: { id: 's-1', siteName: 'Olympia Junction Site', location: 'Olympia' },
          reportedBy: { id: 'u-1', firstName: 'Mekdes', lastName: 'Alemu' },
          assignedMechanic: { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede', position: 'Senior Mechanic', phone: '+251911223344' },
          partsUsed: [
            { id: 'mp-1', quantityUsed: 1, unitCost: 14500, totalCost: 14500, inventoryItem: { itemName: 'Hydraulic Cylinder Seal Kit', itemCode: 'PRT-HYD-001' } },
          ],
        });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/maintenance/${id}`);
        if (!res.ok) throw new Error('Maintenance record not found');
        const data = await res.json();
        setRecord(data);
        setCompDiagnosis(data.diagnosis || '');
        setCompWorkPerformed(data.workPerformed || '');
        setCompLaborCost(data.laborCost?.toString() || '0');
        setCompExtCost(data.externalServiceCost?.toString() || '0');
        setCompDowntime(data.downtimeHours?.toString() || '0');
      } catch (err: any) {
        setError(err.message || 'Error loading maintenance details');
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [id, apiUrl, useMockData]);

  const handleStart = async () => {
    setActionLoading(true);
    setError(null);

    if (useMockData) {
      alert('Demo Mode: Maintenance started!');
      setRecord((prev) => (prev ? { ...prev, status: 'In Progress', startedAt: new Date().toISOString() } : null));
      setShowStartModal(false);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/maintenance/${id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error('Failed to start maintenance');
      setRecord(await res.json());
      setShowStartModal(false);
    } catch (err: any) {
      setError(err.message || 'Error starting maintenance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    const payload = {
      diagnosis: compDiagnosis || undefined,
      workPerformed: compWorkPerformed || undefined,
      laborCost: parseFloat(compLaborCost) || 0,
      externalServiceCost: parseFloat(compExtCost) || 0,
      downtimeHours: parseFloat(compDowntime) || 0,
      nextServiceDate: compNextService || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Maintenance completed!');
      setRecord((prev) => (prev ? { ...prev, status: 'Completed', completedAt: new Date().toISOString() } : null));
      setShowCompleteModal(false);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/maintenance/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to complete maintenance');
      setRecord(await res.json());
      setShowCompleteModal(false);
    } catch (err: any) {
      setError(err.message || 'Error completing maintenance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    if (useMockData) {
      alert('Demo Mode: Maintenance cancelled!');
      setRecord((prev) => (prev ? { ...prev, status: 'Cancelled' } : null));
      setShowCancelModal(false);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/maintenance/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!res.ok) throw new Error('Failed to cancel maintenance');
      setRecord(await res.json());
      setShowCancelModal(false);
    } catch (err: any) {
      setError(err.message || 'Error cancelling maintenance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to soft delete this maintenance record?')) return;
    setActionLoading(true);

    if (useMockData) {
      alert('Demo Mode: Maintenance record deleted!');
      router.push('/dashboard/maintenance');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/maintenance/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete maintenance record');
      router.push('/dashboard/maintenance');
    } catch (err: any) {
      setError(err.message || 'Error deleting maintenance record');
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading maintenance details..." />;

  if (error || !record) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Maintenance Record Not Found'}</div>
        <Link href="/dashboard/maintenance" className="text-xs text-[#0284c7] underline font-semibold">
          Return to Maintenance Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/maintenance" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{record.issueTitle}</h2>
              <MaintenanceStatusBadge status={record.status} />
              <MaintenancePriorityBadge priority={record.priority} />
              <MaintenanceTypeBadge type={record.maintenanceType} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Machine: {record.machine?.brand} {record.machine?.model} ({record.machine?.plateNumber || 'No Plate'}) • Project: {record.project?.projectName || 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-2">
          {record.status !== 'Completed' && (
            <Link
              href={`/dashboard/maintenance/${record.id}/edit`}
              className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs"
            >
              <Edit3 size={15} />
              Edit
            </Link>
          )}

          {(record.status === 'Reported' || record.status === 'Scheduled') && (
            <button
              onClick={() => setShowStartModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-md text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <Play size={15} />
              Start Work
            </button>
          )}

          {record.status === 'In Progress' && (
            <button
              onClick={() => setShowCompleteModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              Complete Work
            </button>
          )}

          {record.status !== 'Completed' && record.status !== 'Cancelled' && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-md text-xs font-bold disabled:opacity-50"
            >
              <XCircle size={15} />
              Cancel
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-md"
            title="Delete Record"
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

      {/* KPI Cost & Downtime Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-xs p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Spare Parts Cost</span>
          <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(record.partsUsedValue)}</div>
          <span className="text-[10px] text-slate-500">Inventory issued</span>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Mechanic Labor Cost</span>
          <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(record.laborCost)}</div>
          <span className="text-[10px] text-slate-500">Assigned technician cost</span>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Repair Cost</span>
          <div className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(record.totalCost)}</div>
          <span className="text-[10px] text-slate-500">Parts + Labor + Service</span>
        </Card>

        <Card className="border border-slate-100 shadow-xs p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Downtime Hours</span>
          <div className="text-xl font-black text-rose-600 mt-1">{record.downtimeHours} Hours</div>
          <span className="text-[10px] text-slate-500">Equipment out of service</span>
        </Card>
      </div>

      {/* Main Breakdown Details */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Breakdown Diagnosis & Work Performed</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-xs text-slate-700">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported Symptoms / Description</span>
            <p className="mt-1 text-slate-900 font-semibold leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
              {record.issueDescription || 'No description recorded.'}
            </p>
          </div>

          {record.diagnosis && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Mechanic Diagnosis</span>
              <p className="mt-1 text-slate-800 leading-relaxed bg-slate-50/50 p-3 rounded-md border border-slate-100">
                {record.diagnosis}
              </p>
            </div>
          )}

          {record.workPerformed && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Work Performed / Repairs Done</span>
              <p className="mt-1 text-slate-800 leading-relaxed bg-slate-50/50 p-3 rounded-md border border-slate-100">
                {record.workPerformed}
              </p>
            </div>
          )}

          {/* Assigned Technician & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Mechanic</span>
              <div className="mt-1 font-bold text-slate-900">
                {record.assignedMechanic ? `${record.assignedMechanic.firstName} ${record.assignedMechanic.lastName}` : 'Unassigned'}
              </div>
              <span className="text-[10px] text-slate-500">{record.assignedMechanic?.position || ''}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Site Location</span>
              <div className="mt-1 font-bold text-slate-900">{record.site?.siteName || 'Depot'}</div>
              <span className="text-[10px] text-slate-500">{record.project?.projectName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spare Parts Used List */}
      {record.partsUsed && record.partsUsed.length > 0 && (
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Inventory Spare Parts Issued</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs">
            <table className="w-full text-left text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Inventory Part</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {record.partsUsed.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.inventoryItem?.itemName}
                      <span className="text-[10px] font-mono text-slate-400 block">{p.inventoryItem?.itemCode}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">{p.quantityUsed}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatCurrency(p.unitCost)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatCurrency(p.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Timeline Audit */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Maintenance Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported Date</span>
              <span className="font-bold text-slate-900 mt-1 block">{new Date(record.reportedDate).toLocaleDateString()}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Scheduled Date</span>
              <span className="font-bold text-slate-900 mt-1 block">{record.scheduledDate ? new Date(record.scheduledDate).toLocaleDateString() : 'N/A'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Started Timestamp</span>
              <span className="font-bold text-slate-900 mt-1 block">{record.startedAt ? new Date(record.startedAt).toLocaleString() : 'Not Started'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Completed Timestamp</span>
              <span className="font-bold text-emerald-700 mt-1 block">{record.completedAt ? new Date(record.completedAt).toLocaleString() : 'Pending'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Start Maintenance Work</h3>
            <p className="text-xs text-slate-500">Initiating work will change status to "In Progress" and set machine status to "Under Maintenance".</p>
            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleStart}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded font-bold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Starting...' : 'Confirm Start Work'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Complete Maintenance Work</h3>
            <p className="text-xs text-slate-500">Log final diagnosis, work performed, labor costs, downtime, and next service reminder.</p>
            <form onSubmit={handleComplete} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Diagnosis</label>
                <textarea
                  rows={2}
                  value={compDiagnosis}
                  onChange={(e) => setCompDiagnosis(e.target.value)}
                  placeholder="Root cause diagnosis..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Work Performed</label>
                <textarea
                  rows={2}
                  value={compWorkPerformed}
                  onChange={(e) => setCompWorkPerformed(e.target.value)}
                  placeholder="Summary of repair actions..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Labor Cost (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    value={compLaborCost}
                    onChange={(e) => setCompLaborCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Downtime (hrs)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={compDowntime}
                    onChange={(e) => setCompDowntime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Next Scheduled Service Date</label>
                <input
                  type="date"
                  value={compNextService}
                  onChange={(e) => setCompNextService(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Completing...' : 'Complete & Unlock Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Cancel Maintenance Record</h3>
            <form onSubmit={handleCancel} className="space-y-3 text-xs">
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden text-slate-900"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded font-bold transition-colors disabled:opacity-50"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
