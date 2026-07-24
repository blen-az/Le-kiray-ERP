'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';

interface Warehouse {
  id: string;
  warehouseName: string;
}

export default function EditInventoryItemPage() {
  const params = useParams();
  const itemId = params.id as string;
  const router = useRouter();

  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [category, setCategory] = useState('Cement');
  const [unit, setUnit] = useState('Bag');
  const [description, setDescription] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('0');
  const [minimumStockLevel, setMinimumStockLevel] = useState('10');
  const [maximumStockLevel, setMaximumStockLevel] = useState('');
  const [averageUnitCost, setAverageUnitCost] = useState('0');
  const [defaultWarehouseId, setDefaultWarehouseId] = useState('');

  const [isFuelItem, setIsFuelItem] = useState(false);
  const [isConsumable, setIsConsumable] = useState(true);
  const [isTool, setIsTool] = useState(false);
  const [isSparePart, setIsSparePart] = useState(false);
  const [status, setStatus] = useState('Active');

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadItemAndWarehouses() {
      if (useMockData) {
        setItemName('Cement 50kg');
        setItemCode('MAT-CEM-001');
        setCategory('Cement');
        setUnit('Bag');
        setDescription('PPC / OPC Type 1 Portland cement bags suitable for high strength concrete structures.');
        setCurrentQuantity('1200');
        setMinimumStockLevel('200');
        setMaximumStockLevel('5000');
        setAverageUnitCost('850');
        setStatus('Active');
        setWarehouses([
          { id: 'wh-1', warehouseName: 'Main Warehouse - Addis Ababa' },
          { id: 'wh-2', warehouseName: 'Bole Site Store' },
        ]);
        setDefaultWarehouseId('wh-1');
        setLoading(false);
        return;
      }

      try {
        const [itemRes, whRes] = await Promise.all([
          fetch(`${apiUrl}/inventory/items/${itemId}`),
          fetch(`${apiUrl}/inventory/warehouses`),
        ]);

        if (whRes.ok) {
          const whData = await whRes.json();
          setWarehouses(whData);
        }

        if (!itemRes.ok) throw new Error('Inventory item not found');
        const item = await itemRes.json();

        setItemName(item.itemName || '');
        setItemCode(item.itemCode || '');
        setCategory(item.category || 'Cement');
        setUnit(item.unit || 'Bag');
        setDescription(item.description || '');
        setCurrentQuantity(item.currentQuantity?.toString() || '0');
        setMinimumStockLevel(item.minimumStockLevel?.toString() || '10');
        setMaximumStockLevel(item.maximumStockLevel?.toString() || '');
        setAverageUnitCost(item.averageUnitCost?.toString() || '0');
        setDefaultWarehouseId(item.defaultWarehouseId || '');
        setIsFuelItem(item.isFuelItem || false);
        setIsConsumable(item.isConsumable || false);
        setIsTool(item.isTool || false);
        setIsSparePart(item.isSparePart || false);
        setStatus(item.status || 'Active');
      } catch (err: any) {
        setError(err.message || 'Error loading item details');
      } finally {
        setLoading(false);
      }
    }

    loadItemAndWarehouses();
  }, [itemId, apiUrl, useMockData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      itemName,
      itemCode: itemCode || undefined,
      category,
      unit,
      description: description || undefined,
      currentQuantity: parseFloat(currentQuantity) || 0,
      minimumStockLevel: parseFloat(minimumStockLevel) || 0,
      maximumStockLevel: maximumStockLevel ? parseFloat(maximumStockLevel) : undefined,
      averageUnitCost: parseFloat(averageUnitCost) || 0,
      defaultWarehouseId: defaultWarehouseId || undefined,
      isFuelItem,
      isConsumable,
      isTool,
      isSparePart,
      status,
    };

    if (useMockData) {
      alert('Demo Mode: Item updated successfully!');
      router.push(`/dashboard/inventory/items/${itemId}`);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/inventory/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update inventory item');
      }

      router.push(`/dashboard/inventory/items/${itemId}`);
    } catch (err: any) {
      setError(err.message || 'Server error updating inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading item specifications..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/inventory/items/${itemId}`} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Edit Inventory Item</h2>
          <p className="text-xs text-slate-500">Update item specifications, re-order threshold, unit cost, or warehouse association.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Edit Item Master Record</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Item Code / SKU</label>
                <input
                  type="text"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="Cement">Cement</option>
                  <option value="Rebar">Rebar</option>
                  <option value="Sand">Sand</option>
                  <option value="Aggregate">Aggregate</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Spare Parts">Spare Parts</option>
                  <option value="Tools">Tools</option>
                  <option value="PPE">PPE</option>
                  <option value="Electrical Materials">Electrical Materials</option>
                  <option value="Plumbing Materials">Plumbing Materials</option>
                  <option value="Finishing Materials">Finishing Materials</option>
                  <option value="Fuel and Lubricants">Fuel & Lubricants</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Unit of Measurement *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="Bag">Bag</option>
                  <option value="Kg">Kg</option>
                  <option value="Ton">Ton</option>
                  <option value="Liter">Liter</option>
                  <option value="Meter">Meter</option>
                  <option value="Piece">Piece</option>
                  <option value="Box">Box</option>
                  <option value="Roll">Roll</option>
                  <option value="Set">Set</option>
                  <option value="Truckload">Truckload</option>
                  <option value="Cubic Meter">Cubic Meter</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Current Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Min Stock Level (Alert)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minimumStockLevel}
                  onChange={(e) => setMinimumStockLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Avg Unit Cost (ETB)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={averageUnitCost}
                  onChange={(e) => setAverageUnitCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Default Warehouse / Store</label>
                <select
                  value={defaultWarehouseId}
                  onChange={(e) => setDefaultWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="">Select Store...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouseName}
                    </option>
                  ))}
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
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href={`/dashboard/inventory/items/${itemId}`}
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
                {submitting ? 'Updating...' : 'Update Item Record'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
