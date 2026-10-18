'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Droplet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { apiFetch } from '@/lib/api';

interface Option { id: string; label: string; }

export default function NewFuelRequestPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Option[]>([]);
  const [sites, setSites] = useState<Option[]>([]);
  const [machines, setMachines] = useState<Option[]>([]);
  const [operators, setOperators] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [litersRequested, setLitersRequested] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    const fetchData = async () => {
      if (useMockData) {
        setProjects([
          { id: 'p-1', label: 'Bole Road Expansion' },
          { id: 'p-2', label: 'Hawassa Housing Project' },
          { id: 'p-3', label: 'Dire Dawa Water Pipeline' },
        ]);
        setMachines([
          { id: 'm-1', label: 'CAT 320D – ET-3-A1234' },
          { id: 'm-2', label: 'Volvo L90 – ET-3-A4321' },
          { id: 'm-3', label: 'Sinotruk Howo 371 – ET-3-A8765' },
        ]);
        setOperators([
          { id: 'emp-1', label: 'Abebe Kebede' },
          { id: 'emp-2', label: 'Tariku Mengistu' },
        ]);
        setLoading(false);
        return;
      }
      try {
        const [projRes, machRes] = await Promise.all([
          apiFetch(`${apiUrl}/projects`),
          apiFetch(`${apiUrl}/machinery`),
        ]);
        if (projRes.ok) {
          const data = await projRes.json();
          setProjects(data.map((p: any) => ({ id: p.id, label: p.projectName })));
        }
        if (machRes.ok) {
          const data = await machRes.json();
          setMachines(data.map((m: any) => ({ id: m.id, label: `${m.brand} ${m.model} – ${m.plateNumber || 'No Plate'}` })));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [useMockData, apiUrl]);

  // Load sites when project changes
  useEffect(() => {
    if (!projectId) { setSites([]); setSiteId(''); return; }
    if (useMockData) {
      const mockSiteMap: Record<string, Option[]> = {
        'p-1': [{ id: 's-1', label: 'Olympia Junction Site' }, { id: 's-2', label: 'Rwanda Traffic Circle Site' }],
        'p-2': [{ id: 's-3', label: 'Hawassa Lake Side site' }],
        'p-3': [{ id: 's-4', label: 'Ganda Site A' }],
      };
      setSites(mockSiteMap[projectId] || []);
      setSiteId('');
      return;
    }
    apiFetch(`${apiUrl}/projects/${projectId}/sites`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setSites(data.map((s: any) => ({ id: s.id, label: s.siteName })));
        setSiteId('');
      });
  }, [projectId, useMockData, apiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !siteId || !machineId || !operatorId || !litersRequested) {
      setError('Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    setError(null);

    if (useMockData) {
      await new Promise(r => setTimeout(r, 600));
      router.push('/dashboard/fuel');
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/fuel/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          siteId,
          machineId,
          operatorId,
          litersRequested: parseFloat(litersRequested),
          requestDate,
          priority,
          purpose: purpose || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Submission failed');
      }
      router.push('/dashboard/fuel');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading form data..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Nav */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/fuel" className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs text-slate-500 font-medium">Back to Fuel Management</span>
      </div>

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="border-b border-slate-50 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-sky-50 text-[#0284c7] p-2.5 rounded-lg">
              <Droplet size={20} />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">New Fuel Request</CardTitle>
              <CardDescription className="mt-0.5">Submit a diesel fuel request for a heavy machinery asset at a project site.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex gap-2 items-start">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Project & Site Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Project *</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                  required
                >
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Site *</label>
                <select
                  value={siteId}
                  onChange={e => setSiteId(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] disabled:opacity-50"
                  disabled={!projectId}
                  required
                >
                  <option value="">Select site...</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                {!projectId && <p className="text-[10px] text-slate-400">Select a project first</p>}
              </div>
            </div>

            {/* Machine & Operator Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Machine *</label>
                <select
                  value={machineId}
                  onChange={e => setMachineId(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                  required
                >
                  <option value="">Select machine...</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Operator *</label>
                <select
                  value={operatorId}
                  onChange={e => setOperatorId(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                  required
                >
                  <option value="">Select operator...</option>
                  {operators.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Liters, Priority, Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Liters Requested *</label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={litersRequested}
                  onChange={e => setLitersRequested(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Priority *</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Request Date *</label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={e => setRequestDate(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                  required
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Purpose / Work Description</label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Daily excavation for trench phase 2"
                className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Notes / Additional Remarks</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any relevant context or observations..."
                className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-50">
              <Link
                href="/dashboard/fuel"
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-md hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#0284c7] hover:bg-[#0275b0] disabled:opacity-60 text-white text-xs font-semibold rounded-md transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Fuel Request'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
