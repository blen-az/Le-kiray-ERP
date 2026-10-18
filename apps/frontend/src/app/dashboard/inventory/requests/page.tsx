'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, Filter, ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { InventoryRequestStatusBadge } from '@/components/inventory/InventoryRequestStatusBadge';
import { InventoryPriorityBadge } from '@/components/inventory/InventoryPriorityBadge';
import { apiFetch } from '@/lib/api';

interface MaterialRequest {
  id: string;
  quantityRequested: number;
  quantityApproved: number;
  quantityIssued: number;
  status: string;
  priority: string;
  requestDate: string;
  purpose?: string;
  project?: { id: string; projectName: string };
  site?: { id: string; siteName: string };
  inventoryItem?: { id: string; itemName: string; unit: string };
  requestedBy?: { firstName: string; lastName: string };
}

const fallbackRequests: MaterialRequest[] = [
  {
    id: 'req-1',
    quantityRequested: 300,
    quantityApproved: 300,
    quantityIssued: 200,
    status: 'Partially Issued',
    priority: 'High',
    purpose: 'Block work and plastering for Block B',
    requestDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
    site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
    inventoryItem: { id: 'i-1', itemName: 'Cement 50kg', unit: 'Bag' },
    requestedBy: { firstName: 'Tariku', lastName: 'Mengistu' },
  },
  {
    id: 'req-2',
    quantityRequested: 10,
    quantityApproved: 0,
    quantityIssued: 0,
    status: 'Pending',
    priority: 'Urgent',
    purpose: 'Underpass retaining wall reinforcement cage',
    requestDate: new Date().toISOString(),
    project: { id: 'p-1', projectName: 'Bole Road Expansion' },
    site: { id: 's-1', siteName: 'Olympia Junction Site' },
    inventoryItem: { id: 'i-2', itemName: 'Rebar 16mm', unit: 'Ton' },
    requestedBy: { firstName: 'Abebe', lastName: 'Kebede' },
  },
  {
    id: 'req-3',
    quantityRequested: 5,
    quantityApproved: 0,
    quantityIssued: 0,
    status: 'Pending',
    priority: 'Urgent',
    purpose: 'Pump station main distribution wiring',
    requestDate: new Date().toISOString(),
    project: { id: 'p-3', projectName: 'Dire Dawa Water Pipeline' },
    site: { id: 's-4', siteName: 'Ganda Site A' },
    inventoryItem: { id: 'i-6', itemName: 'Electric Cable 4mm', unit: 'Roll' },
    requestedBy: { firstName: 'Almaz', lastName: 'Desta' },
  },
];

export default function InventoryRequestsPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>(fallbackRequests);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function fetchRequests() {
      if (useMockData) {
        setRequests(fallbackRequests);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/inventory/requests`);
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        } else {
          setRequests(fallbackRequests);
        }
      } catch (err) {
        console.error('Error fetching requests:', err);
        setRequests(fallbackRequests);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [apiUrl, useMockData]);

  const filtered = requests.filter((r) => {
    const matchesSearch =
      (r.inventoryItem?.itemName && r.inventoryItem.itemName.toLowerCase().includes(search.toLowerCase())) ||
      (r.project?.projectName && r.project.projectName.toLowerCase().includes(search.toLowerCase())) ||
      (r.purpose && r.purpose.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading site material requests..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Site Material Requests</h2>
            <p className="text-xs text-slate-500">Track site material requisitions, project approvals, and warehouse issuances.</p>
          </div>
        </div>

        <Link
          href="/dashboard/inventory/requests/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          New Material Request
        </Link>
      </div>

      {/* Directory Filter Card */}
      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search material, project, site, purpose..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Request Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Issued">Issued</option>
              <option value="Partially Issued">Partially Issued</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-md">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Project & Site</th>
                  <th className="py-3 px-4">Material Item</th>
                  <th className="py-3 px-4 text-right">Req Qty</th>
                  <th className="py-3 px-4 text-right">Appr Qty</th>
                  <th className="py-3 px-4 text-right">Issued Qty</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No material requests match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {new Date(r.requestDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{r.project?.projectName || 'Project'}</span>
                        <span className="text-[10px] text-slate-400 block">{r.site?.siteName || 'Site'}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.inventoryItem?.itemName || 'Item'}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {r.quantityRequested} {r.inventoryItem?.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-sky-700">
                        {r.quantityApproved || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                        {r.quantityIssued || 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <InventoryPriorityBadge priority={r.priority} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <InventoryRequestStatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/inventory/requests/${r.id}`}
                          className="text-[#0284c7] hover:underline font-bold text-xs"
                        >
                          View / Review →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
