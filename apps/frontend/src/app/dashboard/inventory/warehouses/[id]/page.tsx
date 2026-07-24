'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3, Warehouse as WarehouseIcon, MapPin, Building2, Package, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { InventoryStatusBadge } from '@/components/inventory/InventoryStatusBadge';

interface WarehouseDetail {
  id: string;
  warehouseName: string;
  warehouseCode?: string;
  type: string;
  location?: string;
  status: string;
  notes?: string;
  project?: { projectName: string };
  site?: { siteName: string };
  manager?: { firstName: string; lastName: string; email?: string };
  inventoryItems?: Array<{
    id: string;
    itemName: string;
    itemCode?: string;
    category: string;
    unit: string;
    currentQuantity: number;
    totalValue: number;
    status: string;
  }>;
}

export default function WarehouseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadDetail() {
      if (useMockData) {
        setWarehouse({
          id,
          warehouseName: 'Bole Site Store',
          warehouseCode: 'WH-BOL-002',
          type: 'Site Store',
          location: 'Bole Olympia Site Compound',
          status: 'Active',
          notes: 'Primary material dispatch store for Bole Road Expansion project.',
          project: { projectName: 'Bole Road Expansion' },
          site: { siteName: 'Olympia Junction Site' },
          manager: { firstName: 'Abebe', lastName: 'Kebede' },
          inventoryItems: [
            { id: 'i-1', itemName: 'Cement 50kg', category: 'Cement', unit: 'Bag', currentQuantity: 250, totalValue: 212500, status: 'Active' },
            { id: 'i-2', itemName: 'Rebar 16mm', category: 'Rebar', unit: 'Ton', currentQuantity: 15, totalValue: 1875000, status: 'Active' },
          ],
        });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/inventory/warehouses/${id}`);
        if (!res.ok) throw new Error('Warehouse record not found');
        const data = await res.json();
        setWarehouse(data);
      } catch (err: any) {
        setError(err.message || 'Error loading warehouse details');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id, apiUrl, useMockData]);

  if (loading) return <LoadingState message="Loading storehouse details..." />;

  if (error || !warehouse) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Storehouse Not Found'}</div>
        <Link href="/dashboard/inventory/warehouses" className="text-xs text-[#0284c7] underline font-semibold">
          Return to Warehouses Directory
        </Link>
      </div>
    );
  }

  const itemCount = warehouse.inventoryItems?.length || 0;
  const totalStoreValue = warehouse.inventoryItems?.reduce((acc, i) => acc + (i.totalValue || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory/warehouses" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900">{warehouse.warehouseName}</h2>
              <Badge variant="success" className="text-[10px] font-bold py-0.5">
                {warehouse.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Code: {warehouse.warehouseCode || 'N/A'} • Type: {warehouse.type}</p>
          </div>
        </div>

        <Link
          href={`/dashboard/inventory/warehouses/${warehouse.id}/edit`}
          className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
        >
          <Edit3 size={15} />
          Edit Storehouse
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Stocked Items</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{itemCount} materials</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Inventory Value</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(totalStoreValue)}</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Storekeeper</span>
            <div className="text-sm font-bold text-slate-900 mt-2">
              {warehouse.manager ? `${warehouse.manager.firstName} ${warehouse.manager.lastName}` : 'Unassigned'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Stored Materials Inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Material Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Available Qty</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!warehouse.inventoryItems || warehouse.inventoryItems.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No items currently mapped to this store.
                  </td>
                </tr>
              ) : (
                warehouse.inventoryItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Link href={`/dashboard/inventory/items/${item.id}`} className="hover:text-[#0284c7]">
                        {item.itemName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.category}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {item.currentQuantity} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatCurrency(item.totalValue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <InventoryStatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
