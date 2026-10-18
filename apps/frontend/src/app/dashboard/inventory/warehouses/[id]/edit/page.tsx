'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { apiFetch } from '@/lib/api';

interface Project {
  id: string;
  projectName: string;
  sites?: Array<{ id: string; siteName: string }>;
}

export default function EditWarehousePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [type, setType] = useState('Main Warehouse');
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; siteName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadWarehouseAndProjects() {
      if (useMockData) {
        setWarehouseName('Bole Site Store');
        setWarehouseCode('WH-BOL-002');
        setType('Site Store');
        setLocation('Bole Olympia Site Compound');
        setStatus('Active');
        setNotes('Primary material storehouse.');
        setProjects([
          {
            id: 'p-1',
            projectName: 'Bole Road Expansion',
            sites: [
              { id: 's-1', siteName: 'Olympia Junction Site' },
              { id: 's-2', siteName: 'Rwanda Traffic Circle Site' },
            ],
          },
        ]);
        setProjectId('p-1');
        setSiteId('s-1');
        setLoading(false);
        return;
      }

      try {
        const [whRes, projRes] = await Promise.all([
          apiFetch(`${apiUrl}/inventory/warehouses/${id}`),
          apiFetch(`${apiUrl}/projects`),
        ]);

        if (projRes.ok) {
          const pData = await projRes.json();
          setProjects(pData);
        }

        if (!whRes.ok) throw new Error('Warehouse record not found');
        const wh = await whRes.json();

        setWarehouseName(wh.warehouseName || '');
        setWarehouseCode(wh.warehouseCode || '');
        setType(wh.type || 'Main Warehouse');
        setLocation(wh.location || '');
        setStatus(wh.status || 'Active');
        setNotes(wh.notes || '');
        setProjectId(wh.projectId || '');
        setSiteId(wh.siteId || '');
      } catch (err: any) {
        setError(err.message || 'Error loading warehouse details');
      } finally {
        setLoading(false);
      }
    }

    loadWarehouseAndProjects();
  }, [id, apiUrl, useMockData]);

  useEffect(() => {
    if (!projectId) {
      setAvailableSites([]);
      return;
    }
    const sel = projects.find((p) => p.id === projectId);
    setAvailableSites(sel?.sites || []);
  }, [projectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      warehouseName,
      warehouseCode: warehouseCode || undefined,
      type,
      projectId: projectId || undefined,
      siteId: siteId || undefined,
      location: location || undefined,
      status,
      notes: notes || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Warehouse updated!');
      router.push(`/dashboard/inventory/warehouses/${id}`);
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/inventory/warehouses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update warehouse');
      }

      router.push(`/dashboard/inventory/warehouses/${id}`);
    } catch (err: any) {
      setError(err.message || 'Error updating warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading storehouse details..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/inventory/warehouses/${id}`} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Edit Storehouse</h2>
          <p className="text-xs text-slate-500">Update warehouse name, code, type, location or contract project scope.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Storehouse Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Storehouse Name *</label>
                <input
                  type="text"
                  required
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Storehouse Code</label>
                <input
                  type="text"
                  value={warehouseCode}
                  onChange={(e) => setWarehouseCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="Site Store">Site Store</option>
                  <option value="Fuel Store">Fuel Store</option>
                  <option value="Tool Store">Tool Store</option>
                  <option value="Spare Parts Store">Spare Parts Store</option>
                  <option value="Temporary Store">Temporary Store</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {type === 'Site Store' && (
              <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-md space-y-3">
                <span className="font-bold text-[#0284c7] block">Site Store Contract Scope</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Associated Project *</label>
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
                    <label className="font-semibold text-slate-700">Associated Site *</label>
                    <select
                      value={siteId}
                      disabled={!projectId}
                      onChange={(e) => setSiteId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white disabled:opacity-50"
                    >
                      <option value="">Select Site Plot...</option>
                      {availableSites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.siteName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Location Address</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes / Instructions</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href={`/dashboard/inventory/warehouses/${id}`}
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
                {submitting ? 'Saving...' : 'Update Storehouse'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
