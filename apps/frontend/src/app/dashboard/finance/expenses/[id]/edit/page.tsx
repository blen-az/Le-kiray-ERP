'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { apiFetch } from '@/lib/api';

interface FormData {
  expenseDate: string;
  expenseCategory: string;
  expenseType: string;
  amount: string;
  currency: string;
  description: string;
  vendorName: string;
  referenceNumber: string;
  notes: string;
  projectId: string;
  siteId: string;
  machineId: string;
}

const CATEGORIES = ['Fuel', 'Maintenance', 'Materials', 'Labor', 'Equipment Rental', 'Transport', 'Office', 'Utilities', 'Professional Services', 'Other'];
const TYPES = ['Operational', 'Capital', 'Overhead', 'Subcontract'];
const CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP'];

export default function EditExpensePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    expenseDate: '', expenseCategory: 'Fuel', expenseType: 'Operational',
    amount: '', currency: 'ETB', description: '', vendorName: '',
    referenceNumber: '', notes: '', projectId: '', siteId: '', machineId: '',
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function load() {
      if (useMockData) {
        setForm({
          expenseDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          expenseCategory: 'Fuel', expenseType: 'Operational',
          amount: '45000', currency: 'ETB',
          description: 'Emergency diesel for excavation site shift.',
          vendorName: 'Kality Fuel Transports PLC', referenceNumber: 'INV-2026-0891',
          notes: '', projectId: 'p-1', siteId: 's-1', machineId: 'm-1',
        });
        setProjects([{ id: 'p-1', projectName: 'Bole Road Expansion' }, { id: 'p-2', projectName: 'CMC Interchange' }]);
        setSites([{ id: 's-1', siteName: 'Olympia Junction Site' }, { id: 's-2', siteName: 'CMC Site Alpha' }]);
        setMachines([{ id: 'm-1', brand: 'CAT', model: '320D', plateNumber: 'ET-3-A1234' }]);
        setLoading(false);
        return;
      }

      try {
        const [expRes, prRes, sRes, mRes] = await Promise.all([
          apiFetch(`${apiUrl}/finance/expenses/${id}`),
          apiFetch(`${apiUrl}/projects?status=Active&limit=100`),
          apiFetch(`${apiUrl}/projects/sites?limit=100`),
          apiFetch(`${apiUrl}/machinery?limit=100`),
        ]);

        if (!expRes.ok) throw new Error('Expense not found');
        const exp = await expRes.json();
        setForm({
          expenseDate: exp.expenseDate?.split('T')[0] || '',
          expenseCategory: exp.expenseCategory || 'Fuel',
          expenseType: exp.expenseType || 'Operational',
          amount: String(exp.amount || ''),
          currency: exp.currency || 'ETB',
          description: exp.description || '',
          vendorName: exp.vendorName || '',
          referenceNumber: exp.referenceNumber || '',
          notes: exp.notes || '',
          projectId: exp.project?.id || '',
          siteId: exp.site?.id || '',
          machineId: exp.machine?.id || '',
        });

        const prData = await prRes.json();
        const sData = await sRes.json();
        const mData = await mRes.json();
        setProjects(prData.data || prData || []);
        setSites(sData.data || sData || []);
        setMachines(mData.data || mData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, apiUrl, useMockData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      expenseDate: form.expenseDate,
      expenseCategory: form.expenseCategory,
      expenseType: form.expenseType,
      amount: parseFloat(form.amount),
      currency: form.currency,
      description: form.description || undefined,
      vendorName: form.vendorName || undefined,
      referenceNumber: form.referenceNumber || undefined,
      notes: form.notes || undefined,
      projectId: form.projectId || undefined,
      siteId: form.siteId || undefined,
      machineId: form.machineId || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Expense updated!');
      router.push(`/dashboard/finance/expenses/${id}`);
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/finance/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update expense');
      router.push(`/dashboard/finance/expenses/${id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const labelClass = 'text-[10px] font-bold text-slate-500 uppercase block mb-1';
  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#0284c7] focus:border-transparent';

  if (loading) return <LoadingState message="Loading expense record..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/finance/expenses/${id}`} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Edit Expense</h2>
          <p className="text-xs text-slate-500">Update expense record details</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Expense Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Expense Date *</label>
                <input type="date" value={form.expenseDate} onChange={set('expenseDate')} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <select value={form.expenseCategory} onChange={set('expenseCategory')} required className={inputClass}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Amount *</label>
                <input type="number" value={form.amount} onChange={set('amount')} min="0" step="0.01" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <select value={form.currency} onChange={set('currency')} className={inputClass}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Expense Type</label>
                <select value={form.expenseType} onChange={set('expenseType')} className={inputClass}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Vendor Name</label>
                <input type="text" value={form.vendorName} onChange={set('vendorName')} placeholder="e.g. Kality Fuel PLC" className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Reference Number</label>
              <input type="text" value={form.referenceNumber} onChange={set('referenceNumber')} placeholder="e.g. INV-2026-0001" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Description / Purpose</label>
              <textarea value={form.description} onChange={set('description')} rows={3} className={inputClass} placeholder="Describe what this expense was for..." />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Allocation</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Project</label>
                <select value={form.projectId} onChange={set('projectId')} className={inputClass}>
                  <option value="">General / Office</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Site</label>
                <select value={form.siteId} onChange={set('siteId')} className={inputClass}>
                  <option value="">N/A</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.siteName}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Machine (Optional)</label>
              <select value={form.machineId} onChange={set('machineId')} className={inputClass}>
                <option value="">Not Machine-Specific</option>
                {machines.map((m) => <option key={m.id} value={m.id}>{m.brand} {m.model} — {m.plateNumber || ''}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2} className={inputClass} placeholder="Any additional notes..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Link href={`/dashboard/finance/expenses/${id}`} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-sm font-semibold">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white px-5 py-2 rounded-md text-sm font-bold disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
