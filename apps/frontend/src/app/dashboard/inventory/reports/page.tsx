'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, PieChart as PieChartIcon, TrendingUp, AlertTriangle, Layers, DollarSign, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { InventoryStatusBadge } from '@/components/inventory/InventoryStatusBadge';
import { apiFetch } from '@/lib/api';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

interface CategoryData {
  name: string;
  value: number;
}

interface ProjectUsageData {
  projectName: string;
  totalCost: number;
  totalMovements: number;
}

interface ItemReportData {
  id: string;
  itemName: string;
  category: string;
  currentQuantity: number;
  unit: string;
  totalValue: number;
  status: string;
  warehouseName: string;
}

export default function InventoryReportsPage() {
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([
    { name: 'Rebar', value: 10625000 },
    { name: 'Diesel', value: 1657500 },
    { name: 'Cement', value: 1020000 },
    { name: 'Sand', value: 540000 },
    { name: 'PPE', value: 112500 },
  ]);

  const [projectUsage, setProjectUsage] = useState<ProjectUsageData[]>([
    { projectName: 'Bole Road Expansion', totalCost: 243100, totalMovements: 4 },
    { projectName: 'Hawassa Housing Project', totalCost: 170000, totalMovements: 2 },
    { projectName: 'Dire Dawa Water Pipeline', totalCost: 85000, totalMovements: 1 },
  ]);

  const [lowStockItems, setLowStockItems] = useState<ItemReportData[]>([
    { id: '6', itemName: 'Electric Cable 4mm', category: 'Electrical Materials', currentQuantity: 8, unit: 'Roll', totalValue: 33600, status: 'Low Stock', warehouseName: 'Main Warehouse - Addis Ababa' },
    { id: '7', itemName: 'Waterproofing Chemical 20L', category: 'Finishing Materials', currentQuantity: 0, unit: 'Piece', totalValue: 0, status: 'Out of Stock', warehouseName: 'Main Warehouse - Addis Ababa' },
  ]);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadReports() {
      if (useMockData) {
        setLoading(false);
        return;
      }

      try {
        const [catRes, projRes, lowRes] = await Promise.all([
          apiFetch(`${apiUrl}/inventory/reports/by-item`),
          apiFetch(`${apiUrl}/inventory/reports/by-project`),
          apiFetch(`${apiUrl}/inventory/reports/low-stock`),
        ]);

        if (catRes.ok) {
          const itemsData: ItemReportData[] = await catRes.json();
          // Group by category
          const catMap: Record<string, number> = {};
          itemsData.forEach((i) => {
            catMap[i.category] = (catMap[i.category] || 0) + (i.totalValue || 0);
          });
          const formattedCat = Object.entries(catMap).map(([name, value]) => ({ name, value }));
          if (formattedCat.length > 0) setCategoryData(formattedCat);
        }

        if (projRes.ok) {
          const projData = await projRes.json();
          if (projData.length > 0) setProjectUsage(projData);
        }

        if (lowRes.ok) {
          const lowData = await lowRes.json();
          setLowStockItems(lowData);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [apiUrl, useMockData]);

  if (loading) return <LoadingState message="Calculating inventory valuation & consumption analytics..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Inventory Analytics & Reports</h2>
            <p className="text-xs text-slate-500">Valuation breakdown, project consumption trends, and low stock analysis.</p>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Value by Category */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon size={16} className="text-[#0284c7]" />
              Inventory Valuation by Category (ETB)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Capital distribution across material classifications.</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Material Usage by Project */}
        <Card className="border border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-[#0284c7]" />
              Material Consumption Cost by Project
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Total material costs dispatched to active contracts.</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectUsage} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="projectName" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="totalCost" fill="#0284c7" radius={[4, 4, 0, 0]} name="Total Cost (ETB)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Exception Report Table */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              Low Stock & Out-of-Stock Risk Exception Report
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Materials requiring immediate re-order or central stock replenishment.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Material Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Available Qty</th>
                <th className="py-3 px-4">Store Location</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    All inventory items are currently above safety thresholds.
                  </td>
                </tr>
              ) : (
                lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.itemName}</td>
                    <td className="py-3 px-4 font-medium">{item.category}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600">
                      {item.currentQuantity} {item.unit}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{item.warehouseName}</td>
                    <td className="py-3 px-4 text-center">
                      <InventoryStatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/inventory/movements/new?itemId=${item.id}`}
                        className="text-[#0284c7] hover:underline font-bold text-xs"
                      >
                        Replenish →
                      </Link>
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
