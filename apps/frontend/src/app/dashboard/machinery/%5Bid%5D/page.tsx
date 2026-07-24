'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Truck, 
  Plus, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Wrench, 
  FileText, 
  Activity, 
  Edit3,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  MachineryStatusBadge, 
  OwnershipBadge, 
  MachineTypeBadge 
} from '@/components/ui/machinery-badges';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface EmployeeOperator {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Project {
  id: string;
  projectName: string;
}

interface Site {
  id: string;
  siteName: string;
}

interface Assignment {
  id: string;
  startDate: string;
  endDate: string | null;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: string;
  workingHours: number;
  idleHours: number;
  notes: string | null;
  project: { projectName: string };
  site: { siteName: string };
  operator: { firstName: string; lastName: string } | null;
}

interface HistoryEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
}

interface MachineDetails {
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
  assignments: Assignment[];
  fuelLogs?: any[];
}

const mockMachineDetails = (id: string): MachineDetails => ({
  id,
  machineType: 'Excavator',
  brand: 'CAT',
  model: '320D',
  plateNumber: 'ET-3-A1234',
  serialNumber: 'SN-CAT320D-9988',
  capacity: '20 Tons',
  ownershipType: 'Rented from Le’Kiray Marketplace',
  source: 'Le’Kiray Marketplace',
  currentStatus: 'Active',
  currentProjectId: 'p-1',
  currentProject: { id: 'p-1', projectName: 'Bole Road Expansion' },
  currentSiteId: 's-1',
  currentSite: { id: 's-1', siteName: 'Olympia Junction Site' },
  currentOperatorId: 'emp-1',
  currentOperator: { id: 'emp-1', firstName: 'Abebe', lastName: 'Kebede', role: 'OPERATOR' },
  rentalStartDate: new Date('2026-01-01').toISOString(),
  rentalEndDate: new Date('2026-12-31').toISOString(),
  dailyRentalCost: 3500.0,
  hourlyRentalCost: 450.0,
  notes: 'Primary heavy excavator, in good working condition.',
  assignments: [
    {
      id: 'as-1',
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: null,
      expectedReturnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      actualReturnDate: null,
      status: 'Active',
      workingHours: 28.5,
      idleHours: 4.0,
      notes: 'Road construction earthmoving phase.',
      project: { projectName: 'Bole Road Expansion' },
      site: { siteName: 'Olympia Junction Site' },
      operator: { firstName: 'Abebe', lastName: 'Kebede' },
    },
  ],
});

const mockHistoryEvents: HistoryEvent[] = [
  {
    id: 'evt-2',
    type: 'ASSIGNMENT',
    title: 'Assigned to Bole Road Expansion',
    description: 'Deallocated from warehouse and deployed to Olympia Junction Site compound.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt-3',
    type: 'MAINTENANCE',
    title: 'Hydraulic Seal Inspection (Placeholder)',
    description: 'Routine maintenance logged at main workshop.',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt-1',
    type: 'CREATION',
    title: 'Equipment Registered',
    description: 'Asset logged in ERP directory system under Bole Main Depot fleet.',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function MachineDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [machine, setMachine] = useState<MachineDetails | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>(mockHistoryEvents);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'history' | 'fuel' | 'maintenance' | 'reports'>('overview');

  // inline Edit Assignment Modal/Dialog state
  const [isEditingAsg, setIsEditingAsg] = useState(false);
  const [asgWorkingHours, setAsgWorkingHours] = useState(0);
  const [asgIdleHours, setAsgIdleHours] = useState(0);
  const [asgNotes, setAsgNotes] = useState('');

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const loadData = async () => {
    if (useMockData) {
      setMachine(mockMachineDetails(id));
      setHistory(mockHistoryEvents);
      setUsingMock(true);
      setLoading(false);
      return;
    }

    try {
      const [detailsRes, historyRes] = await Promise.all([
        fetch(`${apiUrl}/machinery/${id}`),
        fetch(`${apiUrl}/machinery/${id}/history`),
      ]);

      if (!detailsRes.ok) throw new Error('Could not retrieve machine details from NestJS backend');
      const detailsData = await detailsRes.json();
      setMachine(detailsData);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
      setUsingMock(false);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, useMockData, apiUrl]);

  const activeAssignment = machine?.assignments?.find(
    (a) => a.status === 'Active' || a.status === 'Assigned'
  );

  // Lifecycle handlers
  const handleMarkReturned = async () => {
    if (!activeAssignment) return;
    if (!confirm('Are you sure you want to release this machinery from active project site and log operator return?')) return;

    if (usingMock) {
      alert('Mock Mode: Machinery marked as returned!');
      setMachine({
        ...machine!,
        currentStatus: 'Available',
        currentProjectId: null,
        currentProject: null,
        currentSiteId: null,
        currentSite: null,
        currentOperatorId: null,
        currentOperator: null,
        assignments: machine!.assignments.map((a) =>
          a.id === activeAssignment.id
            ? { ...a, status: 'Returned', actualReturnDate: new Date().toISOString() }
            : a
        ),
      });
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/machinery/assignments/${activeAssignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Returned', actualReturnDate: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Could not return machine');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error returning machine');
    }
  };

  const handleCancelAssignment = async () => {
    if (!activeAssignment) return;
    if (!confirm('Cancel deployment? This clears current location settings and soft-deletes the assignment.')) return;

    if (usingMock) {
      setMachine({
        ...machine!,
        currentStatus: 'Available',
        currentProjectId: null,
        currentProject: null,
        currentSiteId: null,
        currentSite: null,
        currentOperatorId: null,
        currentOperator: null,
        assignments: machine!.assignments.filter((a) => a.id !== activeAssignment.id),
      });
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/machinery/assignments/${activeAssignment.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Could not cancel assignment');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error cancelling assignment');
    }
  };

  const openEditAsgModal = () => {
    if (!activeAssignment) return;
    setAsgWorkingHours(activeAssignment.workingHours);
    setAsgIdleHours(activeAssignment.idleHours);
    setAsgNotes(activeAssignment.notes || '');
    setIsEditingAsg(true);
  };

  const handleSaveAssignmentChanges = async () => {
    if (!activeAssignment) return;

    if (usingMock) {
      setMachine({
        ...machine!,
        assignments: machine!.assignments.map((a) =>
          a.id === activeAssignment.id
            ? { ...a, workingHours: asgWorkingHours, idleHours: asgIdleHours, notes: asgNotes }
            : a
        ),
      });
      setIsEditingAsg(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/machinery/assignments/${activeAssignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workingHours: Number(asgWorkingHours),
          idleHours: Number(asgIdleHours),
          notes: asgNotes,
        }),
      });

      if (!res.ok) throw new Error('Failed to update assignment logs');
      setIsEditingAsg(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving logs');
    }
  };

  if (loading) {
    return <LoadingState message="Fetching heavy machinery details..." />;
  }

  if (error || !machine) {
    return <ErrorState message={error || 'Equipment records could not be found.'} />;
  }

  const isRented = machine.ownershipType !== 'Owned';

  return (
    <div className="space-y-6">
      {/* Edit Assignment Modal */}
      {isEditingAsg && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="max-w-md w-full border border-slate-100 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Clock size={16} className="text-[#0284c7]" />
                Log Operations Hours
              </CardTitle>
              <CardDescription>
                Update operating log details for assignment at <strong>{activeAssignment?.site?.siteName}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700">Cumulative Working Hours</label>
                  <input
                    type="number"
                    value={asgWorkingHours}
                    onChange={(e) => setAsgWorkingHours(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-md focus:ring-1 focus:ring-[#0284c7] outline-none bg-white text-slate-700 font-medium"
                  />
                </div>
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-700">Idle Hours</label>
                  <input
                    type="number"
                    value={asgIdleHours}
                    onChange={(e) => setAsgIdleHours(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-md focus:ring-1 focus:ring-[#0284c7] outline-none bg-white text-slate-700 font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700">Log Remarks / notes</label>
                <textarea
                  rows={3}
                  value={asgNotes}
                  onChange={(e) => setAsgNotes(e.target.value)}
                  placeholder="Record diesel level variations, operator comments..."
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-md focus:ring-1 focus:ring-[#0284c7] outline-none bg-white text-slate-700 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditingAsg(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignmentChanges}
                  className="px-4 py-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white text-xs font-semibold rounded-md"
                >
                  Log Hours
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/machinery"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="text-xs text-slate-500 font-medium">Back to Machinery Directory</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/machinery/${id}/edit`}
            className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 transition-colors"
          >
            <Edit3 size={14} />
            Edit Machine
          </Link>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="border border-slate-100 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-lg text-white mt-1">
                <Truck size={28} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {machine.brand} {machine.model}
                  </h2>
                  <MachineTypeBadge type={machine.machineType} className="bg-white/10 text-white border-white/20" />
                </div>
                <p className="text-white/60 text-xs font-medium">
                  Plate: {machine.plateNumber || 'No Plate'} • SN: {machine.serialNumber || 'N/A'} • Load: {machine.capacity || 'N/A'}
                </p>
                <div className="flex gap-2 pt-1.5">
                  <OwnershipBadge type={machine.ownershipType} className="bg-white/10 text-white border-white/25" />
                  <MachineryStatusBadge status={machine.currentStatus} />
                </div>
              </div>
            </div>

            {/* Cost widget */}
            {isRented && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-lg md:text-right text-xs">
                <span className="text-white/40 uppercase tracking-wider text-[9px] font-bold block">Rental Rates</span>
                <span className="text-white font-extrabold text-sm block mt-0.5">{formatCurrency(machine.dailyRentalCost)} / day</span>
                <span className="text-white/70 font-semibold block">{formatCurrency(machine.hourlyRentalCost)} / hr</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs list */}
      <div className="flex border-b border-slate-100 overflow-x-auto bg-slate-50/50 p-0.5 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'assignments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Assignments ({machine.assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          History Logs
        </button>
        <button
          onClick={() => setActiveTab('fuel')}
          className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'fuel' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Fuel Usage
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'maintenance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Maintenance (Placeholder)
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'reports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Reports (Placeholder)
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border border-slate-100 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">Deployment Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {activeAssignment ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-100/50 px-2 py-0.5 rounded uppercase">Currently Deployed</span>
                          <h4 className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1">
                            <MapPin size={15} className="text-[#0284c7]" />
                            {activeAssignment.site.siteName}
                          </h4>
                          <span className="text-xs text-slate-500 font-medium block mt-0.5">{activeAssignment.project.projectName}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{activeAssignment.workingHours} working hours logged</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-2 border-t border-sky-100/40">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold">Operator</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-0.5 mt-0.5">
                            <User size={12} className="text-slate-400" />
                            {activeAssignment.operator ? `${activeAssignment.operator.firstName} ${activeAssignment.operator.lastName}` : 'Unassigned'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold">Start Date</span>
                          <span className="font-semibold text-slate-800 mt-0.5 block">{formatDate(activeAssignment.startDate)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold">Expected Return</span>
                          <span className="font-semibold text-slate-800 mt-0.5 block">
                            {activeAssignment.expectedReturnDate ? formatDate(activeAssignment.expectedReturnDate) : 'Not Specified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational checklist actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={openEditAsgModal}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Clock size={14} className="text-slate-400" />
                        Log working hours
                      </button>
                      <button
                        onClick={handleMarkReturned}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle size={14} />
                        Mark as Returned
                      </button>
                      <button
                        onClick={handleCancelAssignment}
                        className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors ml-auto"
                      >
                        <XCircle size={14} />
                        Cancel Deployment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <HelpCircle size={32} className="text-slate-300 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Machine is Available</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">This machinery is currently in depot storage and ready for deployment assignments.</p>
                    </div>
                    {['Available', 'Idle', 'Returned'].includes(machine.currentStatus) && (
                      <Link
                        href={`/dashboard/machinery/${id}/assign`}
                        className="inline-flex items-center gap-1 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Plus size={14} />
                        Deploy to Project Site
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">Contract & Origins</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">Ownership Class</span>
                    <span className="font-semibold text-slate-800 mt-1 block">{machine.ownershipType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">Log Source</span>
                    <span className="font-semibold text-slate-800 mt-1 block">{machine.source}</span>
                  </div>
                </div>

                {isRented && (
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">Lease Validity Start</span>
                      <span className="font-semibold text-slate-800 mt-1 block">{machine.rentalStartDate ? formatDate(machine.rentalStartDate) : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">Lease Validity End</span>
                      <span className="font-semibold text-slate-800 mt-1 block">{machine.rentalEndDate ? formatDate(machine.rentalEndDate) : 'N/A'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border border-slate-100 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">Technical specs</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">Manufacture Brand</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{machine.brand}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">Model Number</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{machine.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">Plate License Code</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{machine.plateNumber || 'No plate assigned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">Chassis Serial Number</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{machine.serialNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">Operating Load Capacity</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{machine.capacity || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wide">Internal Remarks</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs text-slate-600 italic">
                {machine.notes || 'No remarks recorded for this asset catalog.'}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <Card className="border border-slate-100 shadow-xs animate-fadeIn">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-slate-900">
              <Activity size={16} className="text-[#0284c7]" />
              Deployment Assignment History
            </CardTitle>
            <CardDescription>Track all previous shifts and logged working metrics for this heavy equipment.</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                  <th className="py-3 px-4">Project & Site Compound</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Actual Return Date</th>
                  <th className="py-3 px-4">Working hours</th>
                  <th className="py-3 px-4">Idle hours</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {machine.assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                      No deployments have been recorded for this machinery.
                    </td>
                  </tr>
                ) : (
                  machine.assignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{asg.site.siteName}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{asg.project.projectName}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {asg.operator ? `${asg.operator.firstName} ${asg.operator.lastName}` : 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">{formatDate(asg.startDate)}</td>
                      <td className="py-3 px-4">{asg.actualReturnDate ? formatDate(asg.actualReturnDate) : 'Still Active'}</td>
                      <td className="py-3 px-4 font-bold text-slate-700">{asg.workingHours} hrs</td>
                      <td className="py-3 px-4 text-slate-500">{asg.idleHours} hrs</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold capitalize border ${
                          asg.status === 'Active' 
                            ? 'bg-sky-50 text-[#0284c7] border-sky-100'
                            : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {asg.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card className="border border-slate-100 shadow-xs animate-fadeIn">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-slate-900">
              <Activity size={16} className="text-[#0284c7]" />
              Chronological Audit Trail
            </CardTitle>
            <CardDescription>Visual event timeline tracking all registry updates, deployments, and placeholder actions.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative border-l border-slate-200 pl-6 ml-2 space-y-6">
              {history.map((evt) => (
                <div key={evt.id} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[31px] top-1 bg-white border border-slate-300 w-3 h-3 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{formatDate(evt.date)}</span>
                    </div>
                    <p className="text-xs text-slate-600">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Equipment Maintenance History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological breakdown logs, preventive service, spare parts, and repair costs for {machine.brand} {machine.model}.</p>
            </div>
            <Link
              href={`/dashboard/maintenance/new?machineId=${machine.id}`}
              className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs"
            >
              <Plus size={14} />
              New Maintenance Log
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-slate-100 shadow-xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Maintenance Logs</span>
              <span className="text-xl font-black text-slate-900 block">Fleet Repairs</span>
              <Link href={`/dashboard/maintenance?machineId=${machine.id}`} className="text-[10px] text-[#0284c7] font-semibold hover:underline block mt-1">
                View Maintenance Directory →
              </Link>
            </Card>

            <Card className="border border-slate-100 shadow-xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Service Schedule</span>
              <span className="text-xl font-black text-emerald-700 block">Reminders & Overdue</span>
              <Link href="/dashboard/maintenance/schedule" className="text-[10px] text-[#0284c7] font-semibold hover:underline block mt-1">
                Check Service Schedule →
              </Link>
            </Card>

            <Card className="border border-slate-100 shadow-xs p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Cost & Downtime</span>
              <span className="text-xl font-black text-rose-600 block">Analytics Audit</span>
              <Link href="/dashboard/maintenance/reports" className="text-[10px] text-[#0284c7] font-semibold hover:underline block mt-1">
                View Maintenance Reports →
              </Link>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <Card className="border border-slate-100 shadow-xs p-6 animate-fadeIn">
          <div className="text-center py-12 space-y-3">
            <AlertTriangle className="text-[#0284c7] mx-auto" size={36} />
            <div>
              <h3 className="text-sm font-bold text-slate-900 capitalize">{activeTab} Module Integration</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                This tab represents a data connection placeholder.
              </p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'fuel' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fuel Usage Logs</h3>
              <p className="text-xs text-slate-500 mt-0.5">All diesel dispensed to this machine, linked from fuel requests.</p>
            </div>
            <Link
              href="/dashboard/fuel/requests/new"
              className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-3 py-1.5 rounded-md text-xs font-semibold"
            >
              New Fuel Request
            </Link>
          </div>
          {machine.fuelLogs && machine.fuelLogs.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border border-slate-100 shadow-xs">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Liters Used</span>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {machine.fuelLogs.reduce((s: number, l: any) => s + (l.litersUsed || 0), 0).toFixed(1)} L
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-slate-100 shadow-xs">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Fuel Cost</span>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {formatCurrency(machine.fuelLogs.reduce((s: number, l: any) => s + (l.totalCost || 0), 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-slate-100 shadow-xs">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Hours Logged</span>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {machine.fuelLogs.reduce((s: number, l: any) => s + (l.workingHours || 0), 0).toFixed(1)} hrs
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card className="border border-slate-100 shadow-xs">
                <CardContent className="p-0">
                  {/* Inline fuel log table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          <th className="py-3 px-4">Usage Date</th>
                          <th className="py-3 px-4">Operator</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4 text-right">Liters</th>
                          <th className="py-3 px-4 text-right">Total Cost</th>
                          <th className="py-3 px-4 text-right">Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {machine.fuelLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-semibold text-slate-800">{formatDate(log.usageDate || log.createdAt)}</td>
                            <td className="py-3 px-4 text-slate-700">
                              {log.operator ? `${log.operator.firstName} ${log.operator.lastName}` : '—'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-800">{log.site?.siteName || '—'}</span>
                              <span className="block text-[10px] text-slate-400">{log.project?.projectName}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold">{(log.litersUsed || 0).toFixed(1)} L</td>
                            <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">{formatCurrency(log.totalCost || 0)}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-700">{log.workingHours ? `${log.workingHours} hrs` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border border-slate-100 shadow-xs">
              <div className="text-center py-12 space-y-2">
                <Wrench className="text-slate-300 mx-auto" size={32} />
                <p className="text-sm font-semibold text-slate-500">No fuel logs recorded for this machine</p>
                <p className="text-xs text-slate-400">Create a fuel request to begin tracking diesel consumption.</p>
                <Link href="/dashboard/fuel/requests/new" className="inline-block mt-2 text-xs text-[#0284c7] font-semibold hover:underline">
                  Create Fuel Request →
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
