'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';

interface Project {
  id: string;
  projectName: string;
  sites?: Array<{ id: string; siteName: string }>;
}

interface Machine {
  id: string;
  brand: string;
  model: string;
  plateNumber?: string;
}

export default function CreateExpensePage() {
  const router = useRouter();

  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [machineId, setMachineId] = useState('');

  const [expenseCategory, setExpenseCategory] = useState('Fuel');
  const [expenseType, setExpenseType] = useState('Operational');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Dropdown options
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; siteName: string }>>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadOptions() {
      if (useMockData) {
        setProjects([
          { id: 'p-1', projectName: 'Bole Road Expansion', sites: [{ id: 's-1', siteName: 'Olympia Junction Site' }, { id: 's-2', siteName: 'Rwanda Traffic Circle Site' }] },
          { id: 'p-2', projectName: 'Hawassa Housing Project', sites: [{ id: 's-3', siteName: 'Hawassa Lake Side site' }] },
          { id: 'p-3', projectName: 'Dire Dawa Water Pipeline', sites: [{ id: 's-4', siteName: 'Dire Dawa Pumping Station Site' }] },
        ]);
        setMachines([
          { id: 'm-1', brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234' },
          { id: 'm-2', brand: 'Volvo', model: 'L90 Loader', plateNumber: 'ET-3-B5678' },
        ]);
        return;
      }

      try {
        const [projRes, macRes] = await Promise.all([
          fetch(`${apiUrl}/projects`),
          fetch(`${apiUrl}/machinery`),
        ]);

        if (projRes.ok) setProjects(await projRes.json());
        if (macRes.ok) setMachines(await macRes.json());
      } catch (err) {
        console.error('Error loading dropdown options:', err);
      }
    }

    loadOptions();
  }, [apiUrl, useMockData]);

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
      projectId: projectId || undefined,
      siteId: siteId || undefined,
      machineId: machineId || undefined,
      expenseCategory,
      expenseType: expenseType || undefined,
      amount: parseFloat(amount),
      currency: currency || 'ETB',
      expenseDate,
      description: description || undefined,
      vendorName: vendorName || undefined,
      receiptUrl: receiptUrl || undefined,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Expense recorded successfully!');
      router.push('/dashboard/finance/expenses');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/finance/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to record expense');
      }

      const created = await res.json();
      router.push(`/dashboard/finance/expenses/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Server error creating expense record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/finance/expenses" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Record Operational Expense</h2>
          <p className="text-xs text-slate-500">Log manual site expenses, subcontractor invoices, tool purchases, permits, or utility payments.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Expense Record Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Project, Site, Machine */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Heavy Machine Asset</label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Select Equipment...</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.model} ({m.plateNumber || 'No Plate'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Expense Category *</label>
                <select
                  required
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white font-bold"
                >
                  <option value="Fuel">Fuel</option>
                  <option value="Inventory / Materials">Inventory / Materials</option>
                  <option value="Machinery Rental">Machinery Rental</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Labor">Labor</option>
                  <option value="Transport">Transport</option>
                  <option value="Subcontractor">Subcontractor</option>
                  <option value="Tools and Equipment">Tools and Equipment</option>
                  <option value="Site Office">Site Office</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Permit / Government Fee">Permit / Government Fee</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Expense Type / Classification</label>
                <input
                  type="text"
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                  placeholder="e.g. Operational, Direct Labor, Overhead..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            {/* Amount, Currency, Expense Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Amount (ETB) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 15000.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-mono"
                  readOnly
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            {/* Vendor & Reference Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Vendor / Supplier Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Kality Fuel Transports PLC"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reference / Invoice Number</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-0891"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            {/* Description & Receipt URL */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Description / Purpose</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed reason for expense..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Receipt / Attachment URL (Optional)</label>
              <input
                type="text"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="e.g. https://storage.le-kiray.com/receipts/r-0192.pdf"
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 font-mono text-[11px]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard/finance/expenses"
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
                {submitting ? 'Recording...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
