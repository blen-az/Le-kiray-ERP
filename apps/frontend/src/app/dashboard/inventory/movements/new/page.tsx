'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';
import { apiFetch } from '@/lib/api';

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  unit: string;
  currentQuantity: number;
  averageUnitCost: number;
  defaultWarehouseId?: string;
}

interface Warehouse {
  id: string;
  warehouseName: string;
}

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

function CreateStockMovementForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get('itemId') || '';

  const [movementType, setMovementType] = useState<string>('STOCK_IN');
  const [inventoryItemId, setInventoryItemId] = useState(initialItemId);
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; siteName: string }>>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const selectedItem = items.find((i) => i.id === inventoryItemId);

  useEffect(() => {
    async function loadFormData() {
      if (useMockData) {
        setItems([
          { id: 'i-1', itemName: 'Cement 50kg', category: 'Cement', unit: 'Bag', currentQuantity: 1200, averageUnitCost: 850 },
          { id: 'i-2', itemName: 'Rebar 16mm', category: 'Rebar', unit: 'Ton', currentQuantity: 85, averageUnitCost: 125000 },
          { id: 'i-4', itemName: 'Diesel', category: 'Diesel', unit: 'Liter', currentQuantity: 15000, averageUnitCost: 110.5 },
        ]);
        setWarehouses([
          { id: 'wh-1', warehouseName: 'Main Warehouse - Addis Ababa' },
          { id: 'wh-2', warehouseName: 'Bole Site Store' },
          { id: 'wh-3', warehouseName: 'Hawassa Site Store' },
          { id: 'wh-4', warehouseName: 'Fuel Store - Main Yard' },
        ]);
        setProjects([
          {
            id: 'p-1',
            projectName: 'Bole Road Expansion',
            sites: [{ id: 's-1', siteName: 'Olympia Junction Site' }],
          },
        ]);
        setMachines([
          { id: 'm-1', brand: 'CAT', model: '320D Excavator', plateNumber: 'ET-3-A1234' },
          { id: 'm-2', brand: 'Volvo', model: 'L90 Loader', plateNumber: 'ET-3-A4321' },
        ]);
        return;
      }

      try {
        const [itemsRes, whRes, projRes, macRes] = await Promise.all([
          apiFetch(`${apiUrl}/inventory/items`),
          apiFetch(`${apiUrl}/inventory/warehouses`),
          apiFetch(`${apiUrl}/projects`),
          apiFetch(`${apiUrl}/machinery`),
        ]);

        if (itemsRes.ok) setItems(await itemsRes.json());
        if (whRes.ok) setWarehouses(await whRes.json());
        if (projRes.ok) setProjects(await projRes.json());
        if (macRes.ok) setMachines(await macRes.json());
      } catch (err) {
        console.error('Error loading dropdowns:', err);
      }
    }
    loadFormData();
  }, [apiUrl, useMockData]);

  // Update site options when project changes
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

  // Update default unit cost when item is selected
  useEffect(() => {
    if (selectedItem) {
      setUnitCost(selectedItem.averageUnitCost.toString());
      if (selectedItem.defaultWarehouseId) {
        if (['STOCK_OUT', 'TRANSFER', 'FUEL_ISSUE'].includes(movementType)) {
          setFromWarehouseId(selectedItem.defaultWarehouseId);
        } else if (movementType === 'STOCK_IN') {
          setToWarehouseId(selectedItem.defaultWarehouseId);
        }
      }
    }
  }, [inventoryItemId, selectedItem, movementType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0');
      setSubmitting(false);
      return;
    }

    if (selectedItem && ['STOCK_OUT', 'TRANSFER', 'DAMAGED', 'LOST', 'FUEL_ISSUE'].includes(movementType)) {
      if (selectedItem.currentQuantity < qty) {
        setError(`Insufficient stock balance for ${selectedItem.itemName}. Available: ${selectedItem.currentQuantity} ${selectedItem.unit}`);
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      inventoryItemId,
      movementType,
      quantity: qty,
      unitCost: parseFloat(unitCost) || undefined,
      fromWarehouseId: fromWarehouseId || undefined,
      toWarehouseId: toWarehouseId || undefined,
      projectId: projectId || undefined,
      siteId: siteId || undefined,
      machineId: machineId || undefined,
      movementDate: movementDate ? new Date(movementDate).toISOString() : undefined,
      referenceNumber: referenceNumber || undefined,
      reason: reason || undefined,
      notes: notes || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Stock movement logged successfully!');
      router.push('/dashboard/inventory/movements');
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/inventory/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to record stock movement');
      }

      router.push('/dashboard/inventory/movements');
    } catch (err: any) {
      setError(err.message || 'Server error recording stock movement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory/movements" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Record Stock Movement</h2>
          <p className="text-xs text-slate-500">Audit material check-ins, site dispatches, store transfers, and machine fuel refueling.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Stock Movement Entry Form</CardTitle>
          <CardDescription className="text-xs text-slate-500">Select movement transaction type to adjust inventory levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Movement Type *</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white font-bold"
                >
                  <option value="STOCK_IN">STOCK IN (Supplier Check-in)</option>
                  <option value="STOCK_OUT">STOCK OUT (Site Dispatch)</option>
                  <option value="TRANSFER">TRANSFER (Storehouse Shift)</option>
                  <option value="FUEL_ISSUE">FUEL ISSUE (Refuel Machine)</option>
                  <option value="ADJUSTMENT_IN">ADJUSTMENT (+ Balance Correction)</option>
                  <option value="ADJUSTMENT_OUT">ADJUSTMENT (- Balance Correction)</option>
                  <option value="RETURN">RETURN (Return unused to store)</option>
                  <option value="DAMAGED">DAMAGED (Write-off damaged)</option>
                  <option value="LOST">LOST (Unaccounted loss)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Material / Inventory Item *</label>
                <select
                  required
                  value={inventoryItemId}
                  onChange={(e) => setInventoryItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Select Item...</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.itemName} (Available: {i.currentQuantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedItem && (
              <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-md flex justify-between items-center text-[#0284c7]">
                <span className="font-semibold">Current Balance: {selectedItem.currentQuantity} {selectedItem.unit}</span>
                <span className="font-bold">Avg Cost: {formatCurrency(selectedItem.averageUnitCost)} / {selectedItem.unit}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Quantity *</label>
                <input
                  type="number"
                  required
                  min="0.0001"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Unit Cost (ETB)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            {['STOCK_OUT', 'TRANSFER', 'ADJUSTMENT_OUT', 'DAMAGED', 'LOST', 'FUEL_ISSUE'].includes(movementType) && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Source Warehouse / Store *</label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Select Source Store...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {['STOCK_IN', 'TRANSFER', 'ADJUSTMENT_IN', 'RETURN'].includes(movementType) && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Destination Warehouse / Store *</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Select Destination Store...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {['STOCK_OUT', 'FUEL_ISSUE'].includes(movementType) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target Project</label>
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
                  <label className="font-semibold text-slate-700">Target Site Plot</label>
                  <select
                    value={siteId}
                    disabled={!projectId}
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
            )}

            {movementType === 'FUEL_ISSUE' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Refueled Machine / Equipment *</label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Select Machine...</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.model} ({m.plateNumber || 'No Plate'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Movement Date</label>
                <input
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reference PO / Waybill #</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. WAY-2025-089"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Reason / Work Purpose</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Foundation casting, excavator daily refuel"
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard/inventory/movements"
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
                {submitting ? 'Recording...' : 'Log Movement Transaction'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateStockMovementPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading movement form..." />}>
      <CreateStockMovementForm />
    </Suspense>
  );
}
