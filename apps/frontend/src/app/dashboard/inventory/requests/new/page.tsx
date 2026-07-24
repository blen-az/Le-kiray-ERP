'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  unit: string;
  currentQuantity: number;
}

interface Project {
  id: string;
  projectName: string;
  sites?: Array<{ id: string; siteName: string }>;
}

export default function CreateInventoryRequestPage() {
  const router = useRouter();

  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantityRequested, setQuantityRequested] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; siteName: string }>>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const selectedItem = items.find((i) => i.id === inventoryItemId);

  useEffect(() => {
    async function loadFormData() {
      if (useMockData) {
        setProjects([
          {
            id: 'p-1',
            projectName: 'Bole Road Expansion',
            sites: [
              { id: 's-1', siteName: 'Olympia Junction Site' },
              { id: 's-2', siteName: 'Rwanda Traffic Circle Site' },
            ],
          },
          {
            id: 'p-2',
            projectName: 'Hawassa Housing Project',
            sites: [{ id: 's-3', siteName: 'Hawassa Lake Side site' }],
          },
        ]);
        setItems([
          { id: 'i-1', itemName: 'Cement 50kg', category: 'Cement', unit: 'Bag', currentQuantity: 1200 },
          { id: 'i-2', itemName: 'Rebar 16mm', category: 'Rebar', unit: 'Ton', currentQuantity: 85 },
          { id: 'i-6', itemName: 'Electric Cable 4mm', category: 'Electrical Materials', unit: 'Roll', currentQuantity: 8 },
        ]);
        return;
      }

      try {
        const [projRes, itemsRes] = await Promise.all([
          fetch(`${apiUrl}/projects`),
          fetch(`${apiUrl}/inventory/items`),
        ]);

        if (projRes.ok) setProjects(await projRes.json());
        if (itemsRes.ok) setItems(await itemsRes.json());
      } catch (err) {
        console.error('Error loading dropdowns:', err);
      }
    }

    loadFormData();
  }, [apiUrl, useMockData]);

  useEffect(() => {
    if (!projectId) {
      setAvailableSites([]);
      setSiteId('');
      return;
    }
    const sel = projects.find((p) => p.id === projectId);
    setAvailableSites(sel?.sites || []);
    setSiteId('');
  }, [projectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const qty = parseFloat(quantityRequested);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity requested must be greater than 0');
      setSubmitting(false);
      return;
    }

    const payload = {
      projectId,
      siteId,
      inventoryItemId,
      quantityRequested: qty,
      priority,
      purpose: purpose || undefined,
      notes: notes || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Material request submitted!');
      router.push('/dashboard/inventory/requests');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/inventory/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit material request');
      }

      router.push('/dashboard/inventory/requests');
    } catch (err: any) {
      setError(err.message || 'Server error submitting material request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory/requests" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Submit Site Material Request</h2>
          <p className="text-xs text-slate-500">Request materials for construction site tasks from central storehouses.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Material Requisition Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Project Contract *</label>
                <select
                  required
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
                <label className="font-semibold text-slate-700">Site Compound Plot *</label>
                <select
                  required
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

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Requested Material Item *</label>
              <select
                required
                value={inventoryItemId}
                onChange={(e) => setInventoryItemId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
              >
                <option value="">Select Item...</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.itemName} ({i.category})
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-md flex justify-between items-center text-[#0284c7]">
                <span className="font-semibold">Current Available Stock: {selectedItem.currentQuantity} {selectedItem.unit}</span>
                <span className="font-bold">Unit: {selectedItem.unit}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Quantity Requested *</label>
                <input
                  type="number"
                  required
                  min="0.0001"
                  step="any"
                  value={quantityRequested}
                  onChange={(e) => setQuantityRequested(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Priority Level *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white font-bold"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Work Purpose / Scope Description</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Underpass retaining wall reinforcement cage"
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Additional Remarks / Delivery Instructions</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard/inventory/requests"
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
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
