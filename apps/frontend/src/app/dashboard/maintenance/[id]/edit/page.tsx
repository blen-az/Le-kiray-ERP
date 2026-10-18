'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { apiFetch } from '@/lib/api';

export default function EditMaintenancePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [maintenanceType, setMaintenanceType] = useState('Breakdown Repair');
  const [priority, setPriority] = useState('Normal');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');

  const [partsUsedValue, setPartsUsedValue] = useState('0');
  const [laborCost, setLaborCost] = useState('0');
  const [externalServiceCost, setExternalServiceCost] = useState('0');
  const [downtimeHours, setDowntimeHours] = useState('0');

  const [reportedDate, setReportedDate] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [odometerOrHourMeterReading, setOdometerOrHourMeterReading] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadRecord() {
      if (useMockData) {
        setMaintenanceType('Breakdown Repair');
        setPriority('Urgent');
        setIssueTitle('Hydraulic Cylinder Oil Leak');
        setIssueDescription('Main excavation boom cylinder leaking high-pressure hydraulic fluid.');
        setPartsUsedValue('14500');
        setLaborCost('3500');
        setDowntimeHours('5.5');
        setReportedDate(new Date().toISOString().slice(0, 10));
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/maintenance/${id}`);
        if (!res.ok) throw new Error('Maintenance record not found');
        const m = await res.json();

        setMaintenanceType(m.maintenanceType || 'Breakdown Repair');
        setPriority(m.priority || 'Normal');
        setIssueTitle(m.issueTitle || '');
        setIssueDescription(m.issueDescription || '');
        setDiagnosis(m.diagnosis || '');
        setWorkPerformed(m.workPerformed || '');
        setPartsUsedValue(m.partsUsedValue?.toString() || '0');
        setLaborCost(m.laborCost?.toString() || '0');
        setExternalServiceCost(m.externalServiceCost?.toString() || '0');
        setDowntimeHours(m.downtimeHours?.toString() || '0');
        setReportedDate(m.reportedDate ? new Date(m.reportedDate).toISOString().slice(0, 10) : '');
        setScheduledDate(m.scheduledDate ? new Date(m.scheduledDate).toISOString().slice(0, 10) : '');
        setNextServiceDate(m.nextServiceDate ? new Date(m.nextServiceDate).toISOString().slice(0, 10) : '');
        setOdometerOrHourMeterReading(m.odometerOrHourMeterReading?.toString() || '');
        setNotes(m.notes || '');
      } catch (err: any) {
        setError(err.message || 'Error loading record details');
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [id, apiUrl, useMockData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      maintenanceType,
      priority,
      issueTitle,
      issueDescription: issueDescription || undefined,
      diagnosis: diagnosis || undefined,
      workPerformed: workPerformed || undefined,
      partsUsedValue: parseFloat(partsUsedValue) || 0,
      laborCost: parseFloat(laborCost) || 0,
      externalServiceCost: parseFloat(externalServiceCost) || 0,
      downtimeHours: parseFloat(downtimeHours) || 0,
      reportedDate,
      scheduledDate: scheduledDate || undefined,
      nextServiceDate: nextServiceDate || undefined,
      odometerOrHourMeterReading: odometerOrHourMeterReading ? parseFloat(odometerOrHourMeterReading) : undefined,
      notes: notes || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Record updated!');
      router.push(`/dashboard/maintenance/${id}`);
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update record');
      }

      router.push(`/dashboard/maintenance/${id}`);
    } catch (err: any) {
      setError(err.message || 'Error updating record');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading maintenance data..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/maintenance/${id}`} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Edit Maintenance Record</h2>
          <p className="text-xs text-slate-500">Update maintenance parameters, diagnosis, or cost entries.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Edit Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Maintenance Type *</label>
                <select
                  required
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white"
                >
                  <option value="Preventive Maintenance">Preventive Maintenance</option>
                  <option value="Corrective Maintenance">Corrective Maintenance</option>
                  <option value="Breakdown Repair">Breakdown Repair</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Oil Change">Oil Change</option>
                  <option value="Tire Service">Tire Service</option>
                  <option value="Hydraulic Service">Hydraulic Service</option>
                  <option value="Electrical Repair">Electrical Repair</option>
                  <option value="Engine Repair">Engine Repair</option>
                  <option value="General Service">General Service</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Priority *</label>
                <select
                  required
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 bg-white font-bold"
                >
                  <option value="Critical">Critical</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Issue Title *</label>
              <input
                type="text"
                required
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Issue Description</label>
              <textarea
                rows={3}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Parts Cost (ETB)</label>
                <input
                  type="number"
                  min="0"
                  value={partsUsedValue}
                  onChange={(e) => setPartsUsedValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Labor Cost (ETB)</label>
                <input
                  type="number"
                  min="0"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">External Service (ETB)</label>
                <input
                  type="number"
                  min="0"
                  value={externalServiceCost}
                  onChange={(e) => setExternalServiceCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Downtime (hrs)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={downtimeHours}
                  onChange={(e) => setDowntimeHours(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href={`/dashboard/maintenance/${id}`}
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
