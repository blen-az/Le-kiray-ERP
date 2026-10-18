'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, Search, Filter, Warehouse as WarehouseIcon, Edit3, Trash2, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';
import { InventoryStatusBadge } from '@/components/inventory/InventoryStatusBadge';
import { InventoryCategoryBadge } from '@/components/inventory/InventoryCategoryBadge';
import { apiFetch } from '@/lib/api';

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

const fallbackItems: InventoryItem[] = [
  { id: '1', itemName: 'Cement 50kg', itemCode: 'MAT-CEM-001', category: 'Cement', unit: 'Bag', currentQuantity: 1200, minimumStockLevel: 200, averageUnitCost: 850, totalValue: 1020000, status: 'Active', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
  { id: '2', itemName: 'Rebar 16mm', itemCode: 'MAT-REB-002', category: 'Rebar', unit: 'Ton', currentQuantity: 85, minimumStockLevel: 15, averageUnitCost: 125000, totalValue: 10625000, status: 'Active', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
  { id: '3', itemName: 'Sand', itemCode: 'MAT-SND-003', category: 'Sand', unit: 'Cubic Meter', currentQuantity: 450, minimumStockLevel: 50, averageUnitCost: 1200, totalValue: 540000, status: 'Active', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
  { id: '4', itemName: 'Diesel', itemCode: 'MAT-FUE-004', category: 'Diesel', unit: 'Liter', currentQuantity: 15000, minimumStockLevel: 2000, averageUnitCost: 110.5, totalValue: 1657500, status: 'Active', defaultWarehouse: { warehouseName: 'Fuel Store - Main Yard' } },
  { id: '5', itemName: 'Safety Helmet', itemCode: 'MAT-PPE-005', category: 'PPE', unit: 'Piece', currentQuantity: 250, minimumStockLevel: 30, averageUnitCost: 450, totalValue: 112500, status: 'Active', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
  { id: '6', itemName: 'Electric Cable 4mm', itemCode: 'MAT-ELE-006', category: 'Electrical Materials', unit: 'Roll', currentQuantity: 8, minimumStockLevel: 15, averageUnitCost: 4200, totalValue: 33600, status: 'Low Stock', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
  { id: '7', itemName: 'Waterproofing Chemical 20L', itemCode: 'MAT-CHM-010', category: 'Finishing Materials', unit: 'Piece', currentQuantity: 0, minimumStockLevel: 10, averageUnitCost: 4800, totalValue: 0, status: 'Out of Stock', defaultWarehouse: { warehouseName: 'Main Warehouse - Addis Ababa' } },
];

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>(fallbackItems);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function fetchItems() {
      if (useMockData) {
        setItems(fallbackItems);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`${apiUrl}/inventory/items`);
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        } else {
          setItems(fallbackItems);
        }
      } catch (err) {
        console.error('Error fetching inventory items:', err);
        setItems(fallbackItems);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [apiUrl, useMockData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to soft delete this inventory item?')) return;
    try {
      if (!useMockData) {
        await apiFetch(`${apiUrl}/inventory/items/${id}`, { method: 'DELETE' });
      }
      setItems(items.filter((i) => i.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting item');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(search.toLowerCase())) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = category === 'ALL' || item.category === category;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return <LoadingState message="Loading inventory material catalog..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Inventory Items Directory</h2>
            <p className="text-xs text-slate-500">Manage all materials, tools, spare parts, and fuel items across company stores.</p>
          </div>
        </div>
        <Link
          href="/dashboard/inventory/items/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          Register New Item
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
                placeholder="Search item name, code, category..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="Cement">Cement</option>
              <option value="Rebar">Rebar</option>
              <option value="Sand">Sand</option>
              <option value="Diesel">Diesel</option>
              <option value="PPE">PPE</option>
              <option value="Electrical Materials">Electrical</option>
              <option value="Plumbing Materials">Plumbing</option>
              <option value="Spare Parts">Spare Parts</option>
              <option value="Finishing Materials">Finishing</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-md">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Item Name & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Min Threshold</th>
                  <th className="py-3 px-4 text-right">Avg Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4">Default Store</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                      No materials or items match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <Link href={`/dashboard/inventory/items/${item.id}`} className="hover:text-[#0284c7]">
                          {item.itemName}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono block font-normal">{item.itemCode || 'NO CODE'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <InventoryCategoryBadge category={item.category} />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{item.unit}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {item.currentQuantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-500">
                        {item.minimumStockLevel.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {formatCurrency(item.averageUnitCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                        {formatCurrency(item.totalValue || item.currentQuantity * item.averageUnitCost)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        <span className="flex items-center gap-1">
                          <WarehouseIcon size={12} className="text-slate-400" />
                          {item.defaultWarehouse?.warehouseName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <InventoryStatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/dashboard/inventory/items/${item.id}`}
                          className="text-[#0284c7] hover:underline font-bold text-[11px]"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/inventory/items/${item.id}/edit`}
                          className="text-slate-600 hover:text-slate-900 font-semibold text-[11px]"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-rose-600 hover:text-rose-800 font-semibold text-[11px]"
                        >
                          Delete
                        </button>
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
