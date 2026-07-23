'use client';

import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, AlertTriangle, ArrowRightLeft, Warehouse, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStockAlert: number;
  warehouse: { name: string };
}

const fallbackItems: InventoryItem[] = [
  { id: 'i-1', name: 'Cement 50kg', category: 'CEMENT', unit: 'BAGS', quantity: 250, minStockAlert: 50, warehouse: { name: 'Bole Central Store' } },
  { id: 'i-2', name: 'Rebar 16mm', category: 'REBAR', unit: 'PCS', quantity: 180, minStockAlert: 30, warehouse: { name: 'Bole Central Store' } },
  { id: 'i-3', name: 'Diesel', category: 'FUEL', unit: 'LITERS', quantity: 4500, minStockAlert: 500, warehouse: { name: 'Bole Central Store' } },
  { id: 'i-4', name: 'Safety Helmet', category: 'SAFETY', unit: 'PCS', quantity: 120, minStockAlert: 15, warehouse: { name: 'Bole Central Store' } },
  { id: 'i-5', name: 'Electric Cable', category: 'CABLE', unit: 'ROLLS', quantity: 8, minStockAlert: 10, warehouse: { name: 'Bole Central Store' } }, // Alert!
  { id: 'i-6', name: 'Cement 50kg', category: 'CEMENT', unit: 'BAGS', quantity: 120, minStockAlert: 20, warehouse: { name: 'Hawassa Site Store' } },
  { id: 'i-7', name: 'Sand', category: 'AGGREGATE', unit: 'M3', quantity: 45, minStockAlert: 10, warehouse: { name: 'Hawassa Site Store' } },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(fallbackItems);
  const [loading, setLoading] = useState(true);
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [itemId, setItemId] = useState('');
  const [qtyChange, setQtyChange] = useState('');
  const [moveType, setMoveType] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');

  useEffect(() => {
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    async function fetchItems() {
      if (useMockData) {
        setItems(fallbackItems);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/inventory/items`);
        if (!res.ok) throw new Error('Failed to load items from backend inventory database');
        const data = await res.json();
        setItems(data);
        setError(null);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Could not connect to ERP server');
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(qtyChange);
    if (isNaN(qty) || !itemId) return;

    // Positive for IN, Negative for OUT
    const delta = moveType === 'STOCK_IN' ? qty : -qty;
    const selectedItem = items.find((i) => i.id === itemId);
    if (!selectedItem) return;

    const updatedItems = items.map((i) => {
      if (i.id === itemId) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    });

    try {
      const res = await fetch('http://localhost:4000/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryItemId: itemId,
          warehouseId: 'any-warehouse', // Placeholder for seed consistency
          quantity: delta,
          movementType: moveType,
        }),
      });
      if (res.ok) {
        const fetchRes = await fetch('http://localhost:4000/api/inventory/items');
        const refetched = await fetchRes.json();
        setItems(refetched);
      } else {
        setItems(updatedItems);
      }
    } catch {
      setItems(updatedItems);
    }

    setQtyChange('');
    setItemId('');
    setShowMoveForm(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading inventory catalog...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg max-w-2xl mx-auto my-12 shadow-xs">
        <h3 className="font-bold text-sm">ERP Connection Error</h3>
        <p className="text-xs mt-1">{error}</p>
        <p className="text-xs mt-3 text-slate-500 border-t border-rose-200/50 pt-2 font-medium">
          Ensure the backend NestJS service is running and accessible. Or toggle <code>NEXT_PUBLIC_USE_MOCK_DATA=true</code> in the environment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Inventory & Storehouses</h2>
          <p className="text-slate-500 text-xs">Manage site store balances, stock level alerts, and material audit movements.</p>
        </div>
        <button
          onClick={() => setShowMoveForm(!showMoveForm)}
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowRightLeft size={16} />
          {showMoveForm ? 'Cancel' : 'Record Stock Movement'}
        </button>
      </div>

      {showMoveForm && (
        <Card className="max-w-xl animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Log Stock Transaction</CardTitle>
            <CardDescription>Adjust store inventory levels by recording material check-ins or dispatches.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Stock Item *</label>
                  <select
                    value={itemId}
                    required
                    onChange={(e) => setItemId(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  >
                    <option value="">Select Item Template...</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.warehouse.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Movement Type</label>
                  <select
                    value={moveType}
                    onChange={(e) => setMoveType(e.target.value as any)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  >
                    <option value="STOCK_IN">STOCK IN (Add Stock)</option>
                    <option value="STOCK_OUT">STOCK OUT (Dispatch / Use)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-slate-700">Quantity Change *</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  value={qtyChange}
                  onChange={(e) => setQtyChange(e.target.value)}
                  placeholder="e.g. 50"
                  className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
              >
                Log Transaction
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Warners */}
      {items.some((i) => i.quantity <= i.minStockAlert) && (
        <Card className="border-rose-100 bg-rose-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-bold text-xs text-rose-900">Material Stock Threshold Warning</h4>
              <p className="text-[11px] text-rose-700 leading-normal mt-0.5">
                The following construction materials are running low. Place orders or transfer from central stock to prevent delays:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {items
                  .filter((i) => i.quantity <= i.minStockAlert)
                  .map((i) => (
                    <span key={i.id} className="text-[10px] font-semibold bg-rose-100 border border-rose-200 text-rose-800 px-2 py-0.5 rounded flex items-center gap-1.5">
                      {i.name} ({i.quantity} {i.unit} remaining in {i.warehouse.name})
                    </span>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Items Directory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Storehouse Ledger Balance</CardTitle>
          <CardDescription>Track material categories, exact quantities, and minimum alert thresholds.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-xs text-left text-slate-500">
            <thead className="text-[10px] text-slate-700 uppercase bg-slate-50 border-y border-slate-200 font-bold">
              <tr>
                <th className="px-6 py-3">Material Name</th>
                <th className="px-6 py-3">Store Location</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Current Balance</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3">Safety Threshold</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item) => {
                const isLow = item.quantity <= item.minStockAlert;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                      <div className="bg-sky-50 text-sky-600 p-1.5 rounded">
                        <Package size={14} />
                      </div>
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Warehouse size={12} className="text-slate-400" />
                        {item.warehouse.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-500">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 font-medium">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-500">
                      {item.minStockAlert} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isLow ? (
                        <Badge variant="destructive" className="text-[10px] py-0 px-2 font-bold animate-pulse">
                          LOW STOCK
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] py-0 px-2 font-bold">
                          ADEQUATE
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
