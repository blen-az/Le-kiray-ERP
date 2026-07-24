'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowRightLeft,
  Warehouse as WarehouseIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  FileCheck,
  FileText,
  DollarSign,
  BarChart3,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { InventoryStatusBadge } from '@/components/inventory/InventoryStatusBadge';
import { InventoryCategoryBadge } from '@/components/inventory/InventoryCategoryBadge';
import { StockMovementTypeBadge } from '@/components/inventory/StockMovementTypeBadge';

interface InventoryItem {
  id: string;
  itemName: string;
  itemCode?: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minimumStockLevel: number;
  averageUnitCost: number;
  totalValue: number;
  status: string;
  defaultWarehouse?: { warehouseName: string };
}

interface SummaryReport {
  totalItems: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  stockInThisMonth: number;
  stockOutThisMonth: number;
  pendingRequestsCount: number;
  topItemsByValue: Array<{
    id: string;
    itemName: string;
    category: string;
    currentQuantity: number;
    unit: string;
    totalValue: number;
  }>;
  recentMovements: Array<{
    id: string;
    movementType: string;
    quantity: number;
    movementDate: string;
    inventoryItem?: { itemName: string; unit: string };
    fromWarehouse?: { warehouseName: string };
    toWarehouse?: { warehouseName: string };
    project?: { projectName: string };
  }>;
}

const fallbackSummary: SummaryReport = {
  totalItems: 10,
  totalStockValue: 12845000,
  lowStockItems: 1,
  outOfStockItems: 1,
  stockInThisMonth: 1250,
  stockOutThisMonth: 420,
  pendingRequestsCount: 2,
  topItemsByValue: [
    { id: '1', itemName: 'Rebar 16mm', category: 'Rebar', currentQuantity: 85, unit: 'Ton', totalValue: 10625000 },
    { id: '2', itemName: 'Diesel', category: 'Diesel', currentQuantity: 15000, unit: 'Liter', totalValue: 1657500 },
    { id: '3', itemName: 'Cement 50kg', category: 'Cement', currentQuantity: 1200, unit: 'Bag', totalValue: 1020000 },
    { id: '4', itemName: 'Sand', category: 'Sand', currentQuantity: 450, unit: 'Cubic Meter', totalValue: 540000 },
    { id: '5', itemName: 'Safety Helmet', category: 'PPE', currentQuantity: 250, unit: 'Piece', totalValue: 112500 },
  ],
  recentMovements: [
    {
      id: 'm1',
      movementType: 'FUEL_ISSUE',
      quantity: 200,
      movementDate: new Date().toISOString(),
      inventoryItem: { itemName: 'Diesel', unit: 'Liter' },
      fromWarehouse: { warehouseName: 'Bole Site Store' },
      project: { projectName: 'Bole Road Expansion' },
    },
    {
      id: 'm2',
      movementType: 'STOCK_OUT',
      quantity: 200,
      movementDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      inventoryItem: { itemName: 'Cement 50kg', unit: 'Bag' },
      fromWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' },
      project: { projectName: 'Hawassa Housing Project' },
    },
    {
      id: 'm3',
      movementType: 'TRANSFER',
      quantity: 2000,
      movementDate: new Date(Date.now() - 86400000 * 4).toISOString(),
      inventoryItem: { itemName: 'Diesel', unit: 'Liter' },
      fromWarehouse: { warehouseName: 'Fuel Store - Main Yard' },
      toWarehouse: { warehouseName: 'Bole Site Store' },
    },
  ],
};

const fallbackItems: InventoryItem[] = [
  { id: '1', itemName: 'Cement 50kg', itemCode: 'MAT-CEM-001', category: 'Cement', unit: 'Bag', currentQuantity: 1200, minimumStockLevel: 200, averageUnitCost: 850, totalValue: 1020000, status: 'Active', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
  { id: '2', itemName: 'Rebar 16mm', itemCode: 'MAT-REB-002', category: 'Rebar', unit: 'Ton', currentQuantity: 85, minimumStockLevel: 15, averageUnitCost: 125000, totalValue: 10625000, status: 'Active', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
  { id: '3', itemName: 'Diesel', itemCode: 'MAT-FUE-004', category: 'Diesel', unit: 'Liter', currentQuantity: 15000, minimumStockLevel: 2000, averageUnitCost: 110.5, totalValue: 1657500, status: 'Active', defaultWarehouse: { warehouseName: 'Fuel Store - Main Yard' } },
  { id: '4', itemName: 'Electric Cable 4mm', itemCode: 'MAT-ELE-006', category: 'Electrical Materials', unit: 'Roll', currentQuantity: 8, minimumStockLevel: 15, averageUnitCost: 4200, totalValue: 33600, status: 'Low Stock', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
  { id: '5', itemName: 'Waterproofing Chemical 20L', itemCode: 'MAT-CHM-010', category: 'Finishing Materials', unit: 'Piece', currentQuantity: 0, minimumStockLevel: 10, averageUnitCost: 4800, totalValue: 0, status: 'Out of Stock', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
];

export default function InventoryDashboardPage() {
  const [summary, setSummary] = useState<SummaryReport>(fallbackSummary);
  const [items, setItems] = useState<InventoryItem[]>(fallbackItems);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadInventoryData() {
      if (useMockData) {
        setSummary(fallbackSummary);
        setItems(fallbackItems);
        setLoading(false);
        return;
      }

      try {
        const [sumRes, itemsRes] = await Promise.all([
          fetch(`${apiUrl}/inventory/reports/summary`),
          fetch(`${apiUrl}/inventory/items`),
        ]);

        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData);
        } else {
          setSummary(fallbackSummary);
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setItems(itemsData);
        } else {
          setItems(fallbackItems);
        }
        setError(null);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Could not connect to ERP backend server');
        setSummary(fallbackSummary);
        setItems(fallbackItems);
      } finally {
        setLoading(false);
      }
    }

    loadInventoryData();
  }, [apiUrl, useMockData]);

  if (loading) {
    return <LoadingState message="Loading inventory balances & storehouse telemetry..." />;
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(search.toLowerCase())) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesLowStock = !lowStockOnly || item.status === 'Low Stock' || item.status === 'Out of Stock';

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-6">
      {/* Header & Main Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Inventory & Storehouses</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Real-time material registers, site store balances, stock movement audit trail, and low-stock alerts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/inventory/requests/new"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText size={15} />
            Material Request
          </Link>
          <Link
            href="/dashboard/inventory/movements/new"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowRightLeft size={15} />
            Record Movement
          </Link>
          <Link
            href="/dashboard/inventory/items/new"
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={16} />
            Create Item
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs">
          <strong>ERP Backend Warning:</strong> {error}. Displaying cached/demo store records.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Items</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{summary.totalItems}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Catalogued Materials</span>
            </div>
            <div className="bg-sky-50 text-[#0284c7] p-2.5 rounded-lg">
              <Package size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Stock Value</span>
              <span className="text-lg font-black text-emerald-700 mt-1 block">{formatCurrency(summary.totalStockValue)}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Assets in Warehouses</span>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Low / Out of Stock</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-black text-amber-600">{summary.lowStockItems}</span>
                <span className="text-xs font-bold text-slate-400">/</span>
                <span className="text-xl font-black text-rose-600">{summary.outOfStockItems}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Below Safety Threshold</span>
            </div>
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Requests</span>
              <span className="text-xl font-black text-[#0284c7] mt-1 block">{summary.pendingRequestsCount}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Awaiting Site Approval</span>
            </div>
            <div className="bg-blue-50 text-[#0284c7] p-2.5 rounded-lg">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert Header */}
      {(summary.lowStockItems > 0 || summary.outOfStockItems > 0) && (
        <Card className="border-rose-200 bg-rose-50/60 shadow-xs">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-xs text-rose-900">Critical Stock Threshold Warnings Detected</h4>
              <p className="text-[11px] text-rose-700 leading-relaxed mt-0.5">
                Certain key materials have reached minimum safety alert levels or are out of stock. Issue transfers or place supplier purchase orders to avoid project downtime.
              </p>
            </div>
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className="text-xs font-bold bg-white hover:bg-rose-100 border border-rose-300 text-rose-800 px-3 py-1.5 rounded-md shadow-2xs transition-colors shrink-0"
            >
              {lowStockOnly ? 'Show All Items' : 'Filter Low Stock Only'}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Directory Quick Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Recent Stock Movements & Top Value */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Item Catalog */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Storehouse Material Ledger</CardTitle>
                <CardDescription className="text-xs text-slate-500">Live quantity balances, unit costs, and warehouse assignments.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/inventory/items"
                  className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1"
                >
                  Full Directory <ArrowUpRight size={13} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search material by name, code, category..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Cement">Cement</option>
                  <option value="Rebar">Rebar</option>
                  <option value="Sand">Sand</option>
                  <option value="Diesel">Diesel</option>
                  <option value="PPE">PPE</option>
                  <option value="Electrical Materials">Electrical</option>
                  <option value="Spare Parts">Spare Parts</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-md">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Item Details</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Default Store</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-right">Total Value</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          No matching inventory items found.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.slice(0, 7).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3">
                            <Link href={`/dashboard/inventory/items/${item.id}`} className="font-bold text-slate-900 hover:text-[#0284c7] block">
                              {item.itemName}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-mono block">{item.itemCode || 'NO CODE'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <InventoryCategoryBadge category={item.category} />
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            <span className="flex items-center gap-1">
                              <WarehouseIcon size={12} className="text-slate-400" />
                              {item.defaultWarehouse?.warehouseName || 'Main Store'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                            {item.currentQuantity.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">{item.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700">
                            {formatCurrency(item.totalValue || item.currentQuantity * item.averageUnitCost)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <InventoryStatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Movement Audit Trail */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Recent Stock Movements</CardTitle>
                <CardDescription className="text-xs text-slate-500">Live dispatch, transfer, and receipt logs.</CardDescription>
              </div>
              <Link href="/dashboard/inventory/movements" className="text-xs font-bold text-[#0284c7] hover:underline">
                View All Logs →
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100 text-xs">
              {summary.recentMovements.slice(0, 5).map((m) => (
                <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <StockMovementTypeBadge type={m.movementType} />
                    <div>
                      <span className="font-bold text-slate-800">
                        {m.inventoryItem?.itemName || 'Item'} ({m.quantity} {m.inventoryItem?.unit || 'units'})
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        From: {m.fromWarehouse?.warehouseName || 'Supplier/External'} → To: {m.toWarehouse?.warehouseName || m.project?.projectName || 'Site Plot'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(m.movementDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Navigation & Top Value Items */}
        <div className="space-y-6">
          {/* Module Navigation Card */}
          <Card className="border border-slate-100 shadow-xs bg-slate-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory Portal Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Link
                href="/dashboard/inventory/items"
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200/70 rounded-md hover:border-sky-300 font-semibold text-slate-800 transition-colors shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Package size={15} className="text-[#0284c7]" /> Items Directory
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>
              <Link
                href="/dashboard/inventory/warehouses"
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200/70 rounded-md hover:border-sky-300 font-semibold text-slate-800 transition-colors shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <WarehouseIcon size={15} className="text-[#0284c7]" /> Warehouses & Stores
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>
              <Link
                href="/dashboard/inventory/movements"
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200/70 rounded-md hover:border-sky-300 font-semibold text-slate-800 transition-colors shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <ArrowRightLeft size={15} className="text-[#0284c7]" /> Movement Logs
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>
              <Link
                href="/dashboard/inventory/requests"
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200/70 rounded-md hover:border-sky-300 font-semibold text-slate-800 transition-colors shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <FileCheck size={15} className="text-[#0284c7]" /> Material Requests
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>
              <Link
                href="/dashboard/inventory/reports"
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200/70 rounded-md hover:border-sky-300 font-semibold text-slate-800 transition-colors shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-[#0284c7]" /> Reports & Analytics
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Top Valued Assets */}
          <Card className="border border-slate-100 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Items by Total Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {summary.topItemsByValue.map((top, idx) => (
                <div key={top.id} className="flex justify-between items-center pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                  <div>
                    <span className="font-bold text-slate-900 block">{idx + 1}. {top.itemName}</span>
                    <span className="text-[10px] text-slate-400 font-medium block">{top.currentQuantity} {top.unit}</span>
                  </div>
                  <span className="font-extrabold text-emerald-700">{formatCurrency(top.totalValue)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
