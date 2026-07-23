'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Plus, 
  Search, 
  MapPin, 
  User, 
  Calendar, 
  Trash2, 
  Edit3, 
  Eye, 
  Link2, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { 
  MachineryStatusBadge, 
  OwnershipBadge, 
  MachineTypeBadge 
} from '@/components/ui/machinery-badges';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface EmployeeOperator {
  id: string;
  firstName: string;
  lastName: string;
}

interface Project {
  id: string;
  projectName: string;
}

interface Site {
  id: string;
  siteName: string;
}

interface Machine {
  id: string;
  machineType: string;
  brand: string;
  model: string;
  plateNumber: string | null;
  serialNumber: string | null;
  capacity: string | null;
  ownershipType: string;
  source: string;
  currentStatus: string;
  currentProjectId: string | null;
  currentProject: Project | null;
  currentSiteId: string | null;
  currentSite: Site | null;
  currentOperatorId: string | null;
  currentOperator: EmployeeOperator | null;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  dailyRentalCost: number;
  hourlyRentalCost: number;
  notes: string | null;
}

const fallbackMachines: Machine[] = [
  {
    id: 'm-1',
    machineType: 'Excavator',
    brand: 'CAT',
    model: '320D',
    plateNumber: 'ET-3-A1234',
    serialNumber: 'SN-CAT320D-9988',
    capacity: '20 Tons',
    ownershipType: 'Owned',
    source: 'Internal Fleet',
    currentStatus: 'Active',
    currentProjectId: 'p-1',
    currentProject: { id: 'p-1', projectName: 'Bole Road Expansion' },
    currentSiteId: 's-1',
    currentSite: { id: 's-1', siteName: 'Olympia Junction Site' },
    currentOperatorId: 'emp-1',
    currentOperator: { id: 'emp-1', firstName: 'Abebe', lastName: 'Kebede' },
    rentalStartDate: null,
    rentalEndDate: null,
    dailyRentalCost: 0,
    hourlyRentalCost: 0,
    notes: 'Primary heavy excavator, in good working condition.',
  },
  {
    id: 'm-2',
    machineType: 'Loader',
    brand: 'Volvo',
    model: 'L90',
    plateNumber: 'ET-3-A4321',
    serialNumber: 'SN-VOL90-7766',
    capacity: '15 Tons',
    ownershipType: 'Rented from Le’Kiray Marketplace',
    source: 'Le’Kiray Marketplace',
    currentStatus: 'Active',
    currentProjectId: 'p-2',
    currentProject: { id: 'p-2', projectName: 'Hawassa Housing Project' },
    currentSiteId: 's-3',
    currentSite: { id: 's-3', siteName: 'Hawassa Lake Side site' },
    currentOperatorId: 'emp-2',
    currentOperator: { id: 'emp-2', firstName: 'Tariku', lastName: 'Mengistu' },
    rentalStartDate: new Date('2026-01-01').toISOString(),
    rentalEndDate: new Date('2026-12-31').toISOString(),
    dailyRentalCost: 3500.0,
    hourlyRentalCost: 450.0,
    notes: 'Rented for road leveling tasks.',
  },
  {
    id: 'm-3',
    machineType: 'Dump Truck',
    brand: 'Sinotruk',
    model: 'Howo 371',
    plateNumber: 'ET-3-A8765',
    serialNumber: 'SN-SINO371-5544',
    capacity: '25 Tons',
    ownershipType: 'Rented Externally',
    source: 'External Rental Provider',
    currentStatus: 'Active',
    currentProjectId: 'p-3',
    currentProject: { id: 'p-3', projectName: 'Dire Dawa Water Pipeline' },
    currentSiteId: 's-4',
    currentSite: { id: 's-4', siteName: 'Ganda Site A' },
    currentOperatorId: null,
    currentOperator: null,
    rentalStartDate: new Date('2026-02-01').toISOString(),
    rentalEndDate: new Date('2026-08-31').toISOString(),
    dailyRentalCost: 4500.0,
    hourlyRentalCost: 600.0,
    notes: 'External supplier rental for heavy soil hauling.',
  },
  {
    id: 'm-4',
    machineType: 'Grader',
    brand: 'CAT',
    model: '140H',
    plateNumber: 'ET-3-A0101',
    serialNumber: 'SN-CAT140H-3322',
    capacity: '18 Tons',
    ownershipType: 'Owned',
    source: 'Internal Fleet',
    currentStatus: 'Under Maintenance',
    currentProjectId: null,
    currentProject: null,
    currentSiteId: null,
    currentSite: null,
    currentOperatorId: null,
    currentOperator: null,
    rentalStartDate: null,
    rentalEndDate: null,
    dailyRentalCost: 0,
    hourlyRentalCost: 0,
    notes: 'Undergoing routine hydraulic hose replacement.',
  },
  {
    id: 'm-5',
    machineType: 'Concrete Mixer',
    brand: 'Sany',
    model: 'Mixer 10m3',
    plateNumber: 'ET-3-A9999',
    serialNumber: 'SN-SANY10-1122',
    capacity: '10 m3',
    ownershipType: 'Rented from Le’Kiray Marketplace',
    source: 'Le’Kiray Marketplace',
    currentStatus: 'Idle',
    currentProjectId: null,
    currentProject: null,
    currentSiteId: null,
    currentSite: null,
    currentOperatorId: null,
    currentOperator: null,
    rentalStartDate: new Date('2026-03-01').toISOString(),
    rentalEndDate: new Date('2026-09-30').toISOString(),
    dailyRentalCost: 2800.0,
    hourlyRentalCost: 350.0,
    notes: 'Ready for structural concrete casting assignments.',
  },
];

export default function MachineryPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter Panel
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ownershipFilter, setOwnershipFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [siteFilter, setSiteFilter] = useState('ALL');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadMachinery() {
      if (useMockData) {
        setMachines(fallbackMachines);
        setUsingMock(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/machinery`);
        if (!res.ok) throw new Error('Failed to load fleet catalog from server');
        const data = await res.json();
        setMachines(data);
        setUsingMock(false);
        setError(null);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Could not connect to ERP server');
      } finally {
        setLoading(false);
      }
    }
    loadMachinery();
  }, [useMockData, apiUrl]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this machine? Associated assignment logs will be soft deleted.')) return;

    if (usingMock) {
      setMachines(machines.filter((m) => m.id !== id));
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/machinery/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete machine from server');
      setMachines(machines.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting machine');
    }
  };

  // Collect unique projects and sites present in current fleet to filter dynamically
  const uniqueProjects = Array.from(
    new Map(
      machines
        .filter((m) => m.currentProject)
        .map((m) => [m.currentProjectId!, m.currentProject!])
    ).values()
  );

  const uniqueSites = Array.from(
    new Map(
      machines
        .filter((m) => m.currentSite)
        .map((m) => [m.currentSiteId!, m.currentSite!])
    ).values()
  );

  // Apply filters
  const filteredMachines = machines.filter((m) => {
    const term = search.toLowerCase();
    const matchesSearch =
      m.machineType.toLowerCase().includes(term) ||
      m.brand.toLowerCase().includes(term) ||
      m.model.toLowerCase().includes(term) ||
      (m.plateNumber && m.plateNumber.toLowerCase().includes(term)) ||
      (m.serialNumber && m.serialNumber.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || m.currentStatus === statusFilter;
    const matchesOwnership = ownershipFilter === 'ALL' || m.ownershipType === ownershipFilter;
    const matchesProject = projectFilter === 'ALL' || m.currentProjectId === projectFilter;
    const matchesSite = siteFilter === 'ALL' || m.currentSiteId === siteFilter;

    return matchesSearch && matchesStatus && matchesOwnership && matchesProject && matchesSite;
  });

  // Calculate Metrics
  const totalCount = machines.length;
  const activeCount = machines.filter(m => ['Active', 'Assigned'].includes(m.currentStatus)).length;
  const idleCount = machines.filter(m => ['Idle', 'Available', 'Returned'].includes(m.currentStatus)).length;
  const maintenanceCount = machines.filter(m => m.currentStatus === 'Under Maintenance').length;
  const utilization = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  if (loading) {
    return <LoadingState message="Loading heavy machinery catalog..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Management"
        description="Register owned assets, track heavy equipment rentals, and log project site assignments."
        actions={
          <Link
            href="/dashboard/machinery/new"
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={16} />
            Add Machinery
          </Link>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-slate-100 shadow-xs bg-slate-50/20">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Machinery</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{totalCount}</h3>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-xs bg-slate-50/20">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Utilization Rate</span>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{utilization}%</h3>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-xs bg-slate-50/20">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Assignments</span>
            <h3 className="text-xl font-extrabold text-[#0284c7] mt-1">{activeCount}</h3>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-xs bg-slate-50/20">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Idle / Available</span>
            <h3 className="text-xl font-extrabold text-amber-600 mt-1">{idleCount}</h3>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-xs bg-slate-50/20 col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Maintenance</span>
            <h3 className="text-xl font-extrabold text-orange-600 mt-1">{maintenanceCount}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filter row */}
      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search machinery type, brand, model, plate, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0284c7] text-slate-700 bg-white"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-md text-xs bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="Active">Active</option>
              <option value="Idle">Idle</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Returned">Returned</option>
              <option value="Out of Service">Out of Service</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <select
              value={ownershipFilter}
              onChange={(e) => setOwnershipFilter(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-md text-xs bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Ownerships</option>
              <option value="Owned">Owned</option>
              <option value="Rented from Le’Kiray Marketplace">Le’Kiray rented</option>
              <option value="Rented Externally">Externally rented</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-md text-xs bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Projects</option>
              {uniqueProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Machinery Directory */}
      {filteredMachines.length === 0 ? (
        <EmptyState
          icon={<Truck size={38} />}
          title="No Heavy Machinery Found"
          description={
            search || statusFilter !== 'ALL' || ownershipFilter !== 'ALL' || projectFilter !== 'ALL'
              ? 'No machines matched your current search filters. Try adjusting active dropdowns.'
              : 'Add your first owned machinery or rented equipment contract to start logging site hours.'
          }
          action={
            !search && statusFilter === 'ALL' && ownershipFilter === 'ALL' && projectFilter === 'ALL' ? (
              <Link
                href="/dashboard/machinery/new"
                className="bg-[#0284c7] hover:bg-[#0275b0] text-white px-3 py-1.5 rounded-md text-xs font-semibold"
              >
                Register Machinery
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card className="border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Equipment Details</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Ownership & Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Current Deployment</th>
                  <th className="py-3 px-4">Assigned Operator</th>
                  <th className="py-3 px-4">Rental Cost</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredMachines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="bg-sky-50 text-[#0284c7] p-2 rounded-md shrink-0 mt-0.5">
                          <Truck size={16} />
                        </div>
                        <div>
                          <Link href={`/dashboard/machinery/${m.id}`} className="font-semibold text-slate-900 hover:text-[#0284c7] transition-colors">
                            {m.brand} {m.model}
                          </Link>
                          <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-0.5">
                            <span>Plate: {m.plateNumber || 'No Plate'}</span>
                            <span>•</span>
                            <span>SN: {m.serialNumber || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <MachineTypeBadge type={m.machineType} />
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div>
                        <OwnershipBadge type={m.ownershipType} />
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">Source: {m.source}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <MachineryStatusBadge status={m.currentStatus} />
                    </td>
                    <td className="py-3.5 px-4">
                      {m.currentProject ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin size={12} className="text-[#0284c7] shrink-0" />
                            {m.currentSite ? m.currentSite.siteName : 'Project compound'}
                          </span>
                          <span className="text-[10px] text-slate-400 block ml-4">{m.currentProject.projectName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Deployed (Idle)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.currentOperator ? (
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <User size={13} className="text-slate-400" />
                          {m.currentOperator.firstName} {m.currentOperator.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.ownershipType !== 'Owned' ? (
                        <div className="space-y-0.5 font-medium">
                          <span className="text-slate-900 block">{formatCurrency(m.dailyRentalCost)}/d</span>
                          <span className="text-[10px] text-slate-400 block">{formatCurrency(m.hourlyRentalCost)}/hr</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/machinery/${m.id}`}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded transition-colors"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/dashboard/machinery/${m.id}/edit`}
                          title="Edit Details"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <Edit3 size={15} />
                        </Link>
                        {['Available', 'Idle', 'Returned'].includes(m.currentStatus) && (
                          <Link
                            href={`/dashboard/machinery/${m.id}/assign`}
                            title="Assign to Site"
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                          >
                            <Link2 size={15} />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(m.id)}
                          title="Delete Machine"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
