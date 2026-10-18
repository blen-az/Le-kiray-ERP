'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3, ArrowRightLeft, AlertTriangle, Package, Warehouse as WarehouseIcon, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';
import { InventoryStatusBadge } from '@/components/inventory/InventoryStatusBadge';
import { InventoryCategoryBadge } from '@/components/inventory/InventoryCategoryBadge';
import { StockMovementTypeBadge } from '@/components/inventory/StockMovementTypeBadge';
import { InventoryRequestStatusBadge } from '@/components/inventory/InventoryRequestStatusBadge';
import { apiFetch } from '@/lib/api';

interface ItemDetail {
  id: string;
  itemName: string;
  itemCode?: string;
  category: string;
  unit: string;
  description?: string;
  currentQuantity: number;
  minimumStockLevel: number;
  maximumStockLevel?: number;
  averageUnitCost: number;
  totalValue: number;
  status: string;
  isFuelItem?: boolean;
  isConsumable?: boolean;
  isTool?: boolean;
  isSparePart?: boolean;
  defaultWarehouse?: { id: string; warehouseName: string };
  stockMovements?: Array<{
    id: string;
    movementType: string;
    quantity: number;
    totalCost?: number;
    movementDate: string;
    fromWarehouse?: { warehouseName: string };
    toWarehouse?: { warehouseName: string };
    project?: { projectName: string };
    site?: { siteName: string };
  }>;
  inventoryRequests?: Array<{
    id: string;
    quantityRequested: number;
    quantityApproved: number;
    quantityIssued: number;
    status: string;
    priority: string;
    requestDate: string;
    project?: { projectName: string };
    site?: { siteName: string };
  }>;
}

export default function InventoryItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;
  const router = useRouter();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadItemDetail() {
      if (useMockData) {
        setItem({
          id: itemId,
          itemName: 'Cement 50kg',
          itemCode: 'MAT-CEM-001',
          category: 'Cement',
          unit: 'Bag',
          description: 'PPC / OPC Type 1 Portland cement bags suitable for high strength concrete structures and site block work.',
          currentQuantity: 1200,
          minimumStockLevel: 200,
          maximumStockLevel: 5000,
          averageUnitCost: 850,
          totalValue: 1020000,
          status: 'Active',
          isConsumable: true,
          defaultWarehouse: { id: 'wh-1', warehouseName: 'Main Warehouse - Addis Ababa' },
          stockMovements: [
            {
              id: 'm-1',
              movementType: 'STOCK_OUT',
              quantity: 200,
              totalCost: 170000,
              movementDate: new Date(Date.now() - 86400000 * 2).toISOString(),
              fromWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' },
              project: { projectName: 'Hawassa Housing Project' },
              site: { siteName: 'Hawassa Lake Side site' },
            },
            {
              id: 'm-2',
              movementType: 'STOCK_IN',
              quantity: 1400,
              totalCost: 1190000,
              movementDate: new Date(Date.now() - 86400000 * 10).toISOString(),
              toWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' },
            },
          ],
          inventoryRequests: [
            {
              id: 'req-1',
              quantityRequested: 300,
              quantityApproved: 300,
              quantityIssued: 200,
              status: 'Partially Issued',
              priority: 'High',
              requestDate: new Date(Date.now() - 86400000 * 3).toISOString(),
              project: { projectName: 'Hawassa Housing Project' },
              site: { siteName: 'Hawassa Lake Side site' },
            },
          ],
        });
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/inventory/items/${itemId}`);
        if (!res.ok) throw new Error('Inventory item not found');
        const data = await res.json();
        setItem(data);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Could not fetch inventory item details');
      } finally {
        setLoading(false);
      }
    }

    loadItemDetail();
  }, [itemId, apiUrl, useMockData]);

  if (loading) {
    return <LoadingState message="Fetching item master record & stock ledger..." />;
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="text-rose-600 font-bold">{error || 'Inventory Item Not Found'}</div>
        <Link href="/dashboard/inventory/items" className="text-xs text-[#0284c7] underline font-semibold">
          Return to Inventory Directory
        </Link>
      </div>
    );
  }

  const isLow = item.currentQuantity <= item.minimumStockLevel;

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory/items" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900">{item.itemName}</h2>
              <InventoryStatusBadge status={item.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">SKU: {item.itemCode || 'N/A'} • Category: {item.category}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/inventory/items/${item.id}/edit`}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <Edit3 size={14} />
            Edit Item
          </Link>
          <Link
            href={`/dashboard/inventory/movements/new?itemId=${item.id}`}
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
          >
            <ArrowRightLeft size={14} />
            Log Stock Movement
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {isLow && (
        <Card className="border-amber-300 bg-amber-50/80 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <div className="text-xs">
              <span className="font-bold text-amber-900 block">Low Stock Alert: Below Minimum Threshold</span>
              <span className="text-amber-800">
                Current balance is {item.currentQuantity} {item.unit} (Safety Minimum: {item.minimumStockLevel} {item.unit}). Replenish stock to prevent site delays.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Available Quantity</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {item.currentQuantity.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Average Unit Cost</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(item.averageUnitCost)}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Inventory Value</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {formatCurrency(item.totalValue || item.currentQuantity * item.averageUnitCost)}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Default Store</span>
            <div className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5">
              <WarehouseIcon size={14} className="text-[#0284c7]" />
              {item.defaultWarehouse?.warehouseName || 'Unassigned'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item Metadata Details */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Material Specifications & Attributes</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">{item.description || 'No detailed specifications added.'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
              <InventoryCategoryBadge category={item.category} className="mt-1" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Safety Min Threshold</span>
              <span className="font-bold block mt-1">{item.minimumStockLevel} {item.unit}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Capacity</span>
              <span className="font-bold block mt-1">{item.maximumStockLevel ? `${item.maximumStockLevel} ${item.unit}` : 'Uncapped'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Material Type</span>
              <span className="font-bold block mt-1">
                {item.isFuelItem ? 'Fuel / Diesel' : item.isTool ? 'Tool' : item.isSparePart ? 'Spare Part' : 'Consumable'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements & Requests Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Movements */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Recent Movement Ledger</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 text-xs">
            {(!item.stockMovements || item.stockMovements.length === 0) ? (
              <div className="p-6 text-center text-slate-400">No stock movements recorded for this item yet.</div>
            ) : (
              item.stockMovements.map((m) => (
                <div key={m.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <StockMovementTypeBadge type={m.movementType} />
                      <span className="font-extrabold text-slate-900">{m.quantity} {item.unit}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {m.project?.projectName || m.fromWarehouse?.warehouseName || m.toWarehouse?.warehouseName || 'Warehouse Log'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(m.movementDate).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Requests */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Site Material Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 text-xs">
            {(!item.inventoryRequests || item.inventoryRequests.length === 0) ? (
              <div className="p-6 text-center text-slate-400">No material requests logged for this item yet.</div>
            ) : (
              item.inventoryRequests.map((r) => (
                <div key={r.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <InventoryRequestStatusBadge status={r.status} />
                      <span className="font-bold text-slate-900">{r.quantityRequested} {item.unit}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {r.project?.projectName} ({r.site?.siteName})
                    </span>
                  </div>
                  <Link href={`/dashboard/inventory/requests/${r.id}`} className="text-xs font-bold text-[#0284c7] hover:underline">
                    Details →
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
