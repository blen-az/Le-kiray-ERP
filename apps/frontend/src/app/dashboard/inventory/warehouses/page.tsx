'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Warehouse as WarehouseIcon, Plus, Search, MapPin, Building2, User, Edit3, Trash2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface WarehouseItem {
  id: string;
  warehouseName: string;
  warehouseCode?: string;
  type: string;
  location?: string;
  status: string;
  project?: { id: string; projectName: string };
  site?: { id: string; siteName: string };
  manager?: { id: string; firstName: string; lastName: string };
  inventoryItems?: Array<{ id: string; currentQuantity: number; totalValue: number }>;
}

const fallbackWarehouses: WarehouseItem[] = [
  { id: '1', warehouseName: 'Main Warehouse - Addis Ababa', warehouseCode: 'WH-ADD-001', type: 'Main Warehouse', location: 'Kaliti Industrial Zone, Addis Ababa', status: 'Active', manager: { id: 'u1', firstName: 'Abebe', lastName: 'Kebede' }, inventoryItems: [{ id: 'i1', currentQuantity: 1200, totalValue: 1020000 }, { id: 'i2', currentQuantity: 85, totalValue: 10625000 }] },
  { id: '2', warehouseName: 'Bole Site Store', warehouseCode: 'WH-BOL-002', type: 'Site Store', location: 'Bole Olympia Site Compound', status: 'Active', project: { id: 'p1', projectName: 'Bole Road Expansion' }, site: { id: 's1', siteName: 'Olympia Junction Site' }, manager: { id: 'u1', firstName: 'Abebe', lastName: 'Kebede' }, inventoryItems: [{ id: 'i3', currentQuantity: 2000, totalValue: 221000 }] },
  { id: '3', warehouseName: 'Hawassa Site Store', warehouseCode: 'WH-HAW-003', type: 'Site Store', location: 'Hawassa Lake Side Compound', status: 'Active', project: { id: 'p2', projectName: 'Hawassa Housing Project' }, site: { id: 's2', siteName: 'Hawassa Lake Side site' } },
  { id: '4', warehouseName: 'Fuel Store - Main Yard', warehouseCode: 'WH-FUL-005', type: 'Fuel Store', location: 'Kaliti Depot Yard', status: 'Active', inventoryItems: [{ id: 'i4', currentQuantity: 15000, totalValue: 1657500 }] },
  { id: '5', warehouseName: 'Spare Parts Store', warehouseCode: 'WH-SPR-006', type: 'Spare Parts Store', location: 'Central Workshop Yard', status: 'Active' },
];

export default function WarehousesListPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(fallbackWarehouses);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function fetchWarehouses() {
      if (useMockData) {
        setWarehouses(fallbackWarehouses);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/inventory/warehouses`);
        if (res.ok) {
          const data = await res.json();
          setWarehouses(data);
        } else {
          setWarehouses(fallbackWarehouses);
        }
      } catch (err) {
        console.error('Error fetching warehouses:', err);
        setWarehouses(fallbackWarehouses);
      } finally {
        setLoading(false);
      }
    }
    fetchWarehouses();
  }, [apiUrl, useMockData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to soft delete this storehouse record?')) return;
    try {
      if (!useMockData) {
        await fetch(`${apiUrl}/inventory/warehouses/${id}`, { method: 'DELETE' });
      }
      setWarehouses(warehouses.filter((w) => w.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting warehouse');
    }
  };

  const filtered = warehouses.filter((w) => {
    const matchesSearch =
      w.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
      (w.warehouseCode && w.warehouseCode.toLowerCase().includes(search.toLowerCase())) ||
      (w.location && w.location.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || w.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <LoadingState message="Loading company warehouses & site stores..." />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Warehouses & Site Stores</h2>
            <p className="text-xs text-slate-500">Central depots, site stores, fuel yards, and spare part compounds.</p>
          </div>
        </div>

        <Link
          href="/dashboard/inventory/warehouses/new"
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus size={16} />
          Add Storehouse
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search store name, code, location..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="ALL">All Store Types</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="Site Store">Site Store</option>
              <option value="Fuel Store">Fuel Store</option>
              <option value="Tool Store">Tool Store</option>
              <option value="Spare Parts Store">Spare Parts Store</option>
              <option value="Temporary Store">Temporary Store</option>
            </select>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No storehouses registered matching current filter.
              </div>
            ) : (
              filtered.map((wh) => {
                const itemCount = wh.inventoryItems?.length || 0;
                const totalVal = wh.inventoryItems?.reduce((acc, i) => acc + (i.totalValue || 0), 0) || 0;

                return (
                  <Card key={wh.id} className="border border-slate-100 shadow-xs hover:shadow-sm transition-shadow">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-800 uppercase">
                            {wh.type}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm mt-1">
                            <Link href={`/dashboard/inventory/warehouses/${wh.id}`} className="hover:text-[#0284c7]">
                              {wh.warehouseName}
                            </Link>
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono block">{wh.warehouseCode || 'NO CODE'}</span>
                        </div>
                        <Badge variant="success" className="text-[9px] py-0 px-2 font-bold">
                          {wh.status}
                        </Badge>
                      </div>

                      {wh.location && (
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span>{wh.location}</span>
                        </div>
                      )}

                      {wh.project && (
                        <div className="p-2 bg-sky-50/50 border border-sky-100 rounded text-[11px] text-sky-900 space-y-0.5">
                          <div className="font-bold flex items-center gap-1">
                            <Building2 size={12} className="text-[#0284c7]" />
                            {wh.project.projectName}
                          </div>
                          {wh.site && <div className="text-[10px] text-sky-700">Site: {wh.site.siteName}</div>}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Stocked Items</span>
                          <span className="font-extrabold text-slate-900 mt-0.5 block">{itemCount} items</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Storekeeper</span>
                          <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                            {wh.manager ? `${wh.manager.firstName} ${wh.manager.lastName}` : 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-bold text-emerald-700">
                          {formatCurrency(totalVal)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/inventory/warehouses/${wh.id}/edit`}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          >
                            <Edit3 size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(wh.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
