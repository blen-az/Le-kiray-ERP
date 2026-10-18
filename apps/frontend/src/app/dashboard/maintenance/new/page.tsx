'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { apiFetch } from '@/lib/api';

interface Machine {
  id: string;
  brand: string;
  model: string;
  plateNumber?: string;
  currentProjectId?: string;
  currentSiteId?: string;
}

interface Project {
  id: string;
  projectName: string;
  sites?: Array<{ id: string; siteName: string }>;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

function CreateMaintenanceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMachineId = searchParams.get('machineId') || '';

  const [machineId, setMachineId] = useState(initialMachineId);
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [assignedMechanicId, setAssignedMechanicId] = useState('');

  const [maintenanceType, setMaintenanceType] = useState('Breakdown Repair');
  const [priority, setPriority] = useState('High');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');

  const [partsUsedValue, setPartsUsedValue] = useState('0');
  const [laborCost, setLaborCost] = useState('0');
  const [externalServiceCost, setExternalServiceCost] = useState('0');
  const [downtimeHours, setDowntimeHours] = useState('0');

  const [reportedDate, setReportedDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduledDate, setScheduledDate] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [odometerOrHourMeterReading, setOdometerOrHourMeterReading] = useState('');
  const [notes, setNotes] = useState('');

  // Dropdown options
  const [machines, setMachines] = useState<Machine[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; siteName: string }>>([]);
  const [mechanics, setMechanics] = useState<Employee[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadOptions() {
      if (useMockData) {
        setMachines([
          { id: 'm-1', brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234', currentProjectId: 'p-1', currentSiteId: 's-1' },
          { id: 'm-2', brand: 'Volvo', model: 'L90 Loader', plateNumber: 'ET-3-B5678', currentProjectId: 'p-2', currentSiteId: 's-3' },
          { id: 'm-3', brand: 'Sinotruk', model: 'Howo Dump Truck', plateNumber: 'ET-3-C9988' },
        ]);
        setProjects([
          { id: 'p-1', projectName: 'Bole Road Expansion', sites: [{ id: 's-1', siteName: 'Olympia Junction Site' }, { id: 's-2', siteName: 'Rwanda Traffic Circle Site' }] },
          { id: 'p-2', projectName: 'Hawassa Housing Project', sites: [{ id: 's-3', siteName: 'Hawassa Lake Side site' }] },
        ]);
        setMechanics([
          { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede', position: 'Senior Heavy Equipment Mechanic' },
          { id: 'e-2', firstName: 'Daniel', lastName: 'Solomon', position: 'Fleet Maintenance Technician' },
        ]);
        return;
      }

      try {
        const [macRes, projRes, empRes] = await Promise.all([
          apiFetch(`${apiUrl}/machinery`),
          apiFetch(`${apiUrl}/projects`),
          apiFetch(`${apiUrl}/hr/employees`),
        ]);

        if (macRes.ok) setMachines(await macRes.json());
        if (projRes.ok) setProjects(await projRes.json());
        if (empRes.ok) {
          const emps: Employee[] = await empRes.json();
          setMechanics(
            emps.filter(
              (e) =>
                e.position.toLowerCase().includes('mechanic') ||
                e.position.toLowerCase().includes('maintenance') ||
                e.position.toLowerCase().includes('technician') ||
                e.position.toLowerCase().includes('fleet'),
            ),
          );
        }
      } catch (err) {
        console.error('Error loading options:', err);
      }
    }

    loadOptions();
  }, [apiUrl, useMockData]);

  // Auto-fill project & site when machine is selected
  useEffect(() => {
    if (!machineId) return;
    const selectedMac = machines.find((m) => m.id === machineId);
    if (selectedMac?.currentProjectId) {
      setProjectId(selectedMac.currentProjectId);
    }
    if (selectedMac?.currentSiteId) {
      setSiteId(selectedMac.currentSiteId);
    }
  }, [machineId, machines]);

  // Update available sites when project changes
  useEffect(() => {
    if (!projectId) {
      setAvailableSites([]);
      setSiteId('');
      return;
    }
    const selProj = projects.find((p) => p.id === projectId);
    setAvailableSites(selProj?.sites || []);
    if (!selProj?.sites?.some((s) => s.id === siteId)) {
      setSiteId('');
    }
  }, [projectId, projects, siteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      machineId,
      projectId: projectId || undefined,
      siteId: siteId || undefined,
      assignedMechanicId: assignedMechanicId || undefined,
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
      alert('Demo Mode: Maintenance record created successfully!');
      router.push('/dashboard/maintenance');
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create maintenance record');
      }

      const created = await res.json();
      router.push(`/dashboard/maintenance/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Server error creating maintenance record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/maintenance" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Create Machinery Maintenance Record</h2>
          <p className="text-xs text-slate-500">Report machine breakdown, preventive service, mechanic assignment, and cost estimates.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Maintenance Request Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Machine & Location Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Machine Asset *</label>
                <select
                  required
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white font-bold"
                >
                  <option value="">Select Equipment...</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.model} ({m.plateNumber || 'No Plate'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Project Contract</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Site Compound</label>
                <select
                  disabled={!projectId}
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white disabled:opacity-50"
                >
                  <option value="">Select Site...</option>
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type, Priority, Mechanic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Maintenance Type *</label>
                <select
                  required
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
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
                <label className="font-semibold text-slate-700">Priority Level *</label>
                <select
                  required
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white font-bold"
                >
                  <option value="Critical">Critical</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Assigned Mechanic</label>
                <select
                  value={assignedMechanicId}
                  onChange={(e) => setAssignedMechanicId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Unassigned</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Issue Description */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Issue Title *</label>
              <input
                type="text"
                required
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="e.g. Hydraulic Boom Line Leak or 500-Hour Filter Service"
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Issue Description / Symptoms</label>
              <textarea
                rows={3}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Detailed description of breakdown, noise, fluid leak, or warning lights reported..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            {/* Dates & Meter Reading */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reported Date *</label>
                <input
                  type="date"
                  required
                  value={reportedDate}
                  onChange={(e) => setReportedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Scheduled Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Hour Meter Reading</label>
                <input
                  type="number"
                  step="any"
                  value={odometerOrHourMeterReading}
                  onChange={(e) => setOdometerOrHourMeterReading(e.target.value)}
                  placeholder="e.g. 4250.5 hrs"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            {/* Cost Estimates & Downtime */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Estimated Parts Cost (ETB)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={partsUsedValue}
                  onChange={(e) => setPartsUsedValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Estimated Labor Cost (ETB)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">External Service (ETB)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={externalServiceCost}
                  onChange={(e) => setExternalServiceCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Estimated Downtime (hrs)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={downtimeHours}
                  onChange={(e) => setDowntimeHours(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard/maintenance"
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
                {submitting ? 'Creating...' : 'Create Record'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateMaintenancePage() {
  return (
    <Suspense fallback={<LoadingState message="Loading maintenance form..." />}>
      <CreateMaintenanceForm />
    </Suspense>
  );
}
