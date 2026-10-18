'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, Plus, Search, Filter, Warehouse as WarehouseIcon, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';
import { StockMovementTypeBadge } from '@/components/inventory/StockMovementTypeBadge';
import { apiFetch } from '@/lib/api';

interface StockMovement {
  id: string;
  movementType: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  movementDate: string;
  referenceNumber?: string;
  reason?: string;
  notes?: string;
  inventoryItem?: { id: string; itemName: string; unit: string };
  fromWarehouse?: { id: string; warehouseName: string };
  toWarehouse?: { id: string; warehouseName: string };
  project?: { id: string; projectName: string };
  site?: { id: string; siteName: string };
  requestedBy?: { firstName: string; lastName: string };
  approvedBy?: { firstName: string; lastName: string };
  issuedBy?: { firstName: string; lastName: string };
}

const fallbackMovements: StockMovement[] = [
  {
    id: 'm-1',
    movementType: 'FUEL_ISSUE',
    quantity: 200,
    unitCost: 110.5,
    totalCost: 22100,
    movementDate: new Date().toISOString(),
    referenceNumber: 'FUEL-CAT-320D-01',
    reason: 'Daily excavating operations refuel',
    inventoryItem: { id: 'i-4', itemName: 'Diesel', unit: 'Liter' },
    fromWarehouse: { id: 'wh-2', warehouseName: 'Bole Site Store' },
    project: { id: 'p-1', projectName: 'Bole Road Expansion' },
    site: { id: 's-1', siteName: 'Olympia Junction Site' },
    requestedBy: { firstName: 'Abebe', lastName: 'Operator' },
    approvedBy: { firstName: 'Fleet', lastName: 'Manager' },
  },
  {
    id: 'm-2',
    movementType: 'STOCK_OUT',
    quantity: 200,
    unitCost: 850,
    totalCost: 170000,
    movementDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    referenceNumber: 'DISP-CEM-088',
    reason: 'Foundation concrete pour phase 2',
    inventoryItem: { id: 'i-1', itemName: 'Cement 50kg', unit: 'Bag' },
    fromWarehouse: { id: 'wh-1', warehouseName: 'Main Warehouse - Addis Ababa' },
    project: { id: 'p-2', projectName: 'Hawassa Housing Project' },
    site: { id: 's-3', siteName: 'Hawassa Lake Side site' },
    requestedBy: { firstName: 'Tariku', lastName: 'Site Manager' },
    approvedBy: { firstName: 'Inventory', lastName: 'Manager' },
  },
  {
    id: 'm-3',
    movementType: 'TRANSFER',
    quantity: 2000,
    unitCost: 110.5,
    totalCost: 221000,
    movementDate: new Date(Date.now() - 86400000 * 4).toISOString(),
    referenceNumber: 'TRF-FUE-001',
    reason: 'Site generator and heavy machine refuel store dispatch',
    inventoryItem: { id: 'i-4', itemName: 'Diesel', unit: 'Liter' },
    fromWarehouse: { id: 'wh-4', warehouseName: 'Fuel Store - Main Yard' },
    toWarehouse: { id: 'wh-2', warehouseName: 'Bole Site Store' },
    approvedBy: { firstName: 'Inventory', lastName: 'Manager' },
  },
  {
    id: 'm-4',
    movementType: 'STOCK_IN',
    quantity: 1200,
    unitCost: 850,
    totalCost: 1020000,
    movementDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    referenceNumber: 'REC-INIT-MAT-CEM-001',
    reason: 'Initial store inventory opening stock',
    inventoryItem: { id: 'i-1', itemName: 'Cement 50kg', unit: 'Bag' },
    toWarehouse: { id: 'wh-1', warehouseName: 'Main Warehouse - Addis Ababa' },
  },
];

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>(fallbackMovements);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function fetchMovements() {
      if (useMockData) {
        setMovements(fallbackMovements);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/inventory/movements`);
        if (res.ok) {
          const data = await res.json();
          setMovements(data);
        } else {
          setMovements(fallbackMovements);
        }
      } catch (err) {
        console.error('Error fetching movements:', err);
        setMovements(fallbackMovements);
      } finally {
        setLoading(false);
      }
    }

    fetchMovements();
  }, [apiUrl, useMockData]);

  const filtered = movements.filter((m) => {
    const matchesSearch =
      (m.inventoryItem?.itemName && m.inventoryItem.itemName.toLowerCase().includes(search.toLowerCase())) ||
      (m.referenceNumber && m.referenceNumber.toLowerCase().includes(search.toLowerCase())) ||
      (m.reason && m.reason.toLowerCase().includes(search.toLowerCase())) ||
      (m.project?.projectName && m.project.projectName.toLowerCase().includes(search.toLowerCase()));

    const matchesType = movementType === 'ALL' || m.movementType === movementType;

    return matchesSearch && matchesType;
  });

  if (loading) return <LoadingState message="Loading stock movement audit trail..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Stock Movements & Audit Logs</h2>
            <p className="text-xs text-slate-500">Comprehensive audit record of material receipts, site dispatches, store transfers, and fuel allocations.</p>
          </div>
        </div>

        <Link
          href="/dashboard/inventory/movements/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          Record Stock Movement
        </Link>
      </div>

      {/* Filter Card */}
      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search material, reference waybill, project or reason..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Movement Types</option>
              <option value="STOCK_IN">STOCK IN (Receipts)</option>
              <option value="STOCK_OUT">STOCK OUT (Site Dispatch)</option>
              <option value="TRANSFER">TRANSFER (Store Shift)</option>
              <option value="FUEL_ISSUE">FUEL ISSUE</option>
              <option value="ADJUSTMENT_IN">ADJUSTMENT (+)</option>
              <option value="ADJUSTMENT_OUT">ADJUSTMENT (-)</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="LOST">LOST</option>
              <option value="RETURN">RETURN</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-md">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">Material Item</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4">From Store</th>
                  <th className="py-3 px-4">To Store / Project</th>
                  <th className="py-3 px-4">Ref # / Reason</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No stock movement audit records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {new Date(m.movementDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StockMovementTypeBadge type={m.movementType} />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {m.inventoryItem?.itemName || 'Item'}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {m.quantity.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">{m.inventoryItem?.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(m.totalCost || 0)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {m.fromWarehouse?.warehouseName || 'External Supplier'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {m.toWarehouse?.warehouseName || m.project?.projectName || 'Site Consumption'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-slate-800 block">{m.referenceNumber || 'NO REF'}</span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">{m.reason || m.notes || '-'}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {m.approvedBy ? `${m.approvedBy.firstName} ${m.approvedBy.lastName}` : 'System'}
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
