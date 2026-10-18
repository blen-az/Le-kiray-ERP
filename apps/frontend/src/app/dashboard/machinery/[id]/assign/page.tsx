'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Link2, Calendar, MapPin, User, FileText, Briefcase } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { apiFetch } from '@/lib/api';

// Schema Validation
const assignSchema = z.object({
  projectId: z.string().min(1, { message: 'Project ID is required' }),
  siteId: z.string().min(1, { message: 'Site ID is required' }),
  operatorId: z.string().optional().or(z.literal('')),
  startDate: z.string().min(1, { message: 'Start date is required' }),
  expectedReturnDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.expectedReturnDate) {
    return new Date(data.expectedReturnDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'Expected return date cannot be before start date',
  path: ['expectedReturnDate'],
});

type AssignFormValues = z.infer<typeof assignSchema>;

interface Site {
  id: string;
  siteName: string;
}

interface Project {
  id: string;
  projectName: string;
  sites: Site[];
}

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

const mockProjects: Project[] = [
  {
    id: 'p-1',
    projectName: 'Bole Road Expansion',
    sites: [
      { id: 's-1', siteName: 'Bole Main Excavation Site' },
      { id: 's-2', siteName: 'Rwanda Traffic Circle Site' },
    ],
  },
  {
    id: 'p-2',
    projectName: 'Hawassa Housing Project',
    sites: [
      { id: 's-3', siteName: 'Hawassa Lake Side site' },
    ],
  },
];

const mockOperators: Operator[] = [
  { id: 'emp-1', firstName: 'Abebe', lastName: 'Kebede', role: 'OPERATOR' },
  { id: 'emp-2', firstName: 'Tariku', lastName: 'Mengistu', role: 'OPERATOR' },
  { id: 'emp-3', firstName: 'Genet', lastName: 'Alemu', role: 'LABORER' },
];

export default function AssignMachinePage() {
  const router = useRouter();
  const params = useParams();
  const machineId = params.id as string;

  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [operators, setOperators] = useState<Operator[]>(mockOperators);
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      projectId: '',
      siteId: '',
      operatorId: '',
      startDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: '',
      notes: '',
    },
  });

  const selectedProjectId = watch('projectId');
  const availableSites = projects.find((p) => p.id === selectedProjectId)?.sites || [];

  // Reset site when project changes
  useEffect(() => {
    setValue('siteId', '');
  }, [selectedProjectId, setValue]);

  useEffect(() => {
    async function loadFormOptions() {
      if (useMockData) {
        setLoadingForm(false);
        return;
      }

      try {
        // Load projects and operators concurrently
        const [projRes, empRes] = await Promise.all([
          apiFetch(`${apiUrl}/projects`),
          apiFetch(`${apiUrl}/hr/employees`),
        ]);

        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData);
        }
        if (empRes.ok) {
          const empData = await empRes.json();
          setOperators(empData);
        }
      } catch (err) {
        console.warn('Using fallback form dropdown details due to API connection state:', err);
      } finally {
        setLoadingForm(false);
      }
    }
    loadFormOptions();
  }, [useMockData, apiUrl]);

  const onSubmit = async (values: AssignFormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      projectId: values.projectId,
      siteId: values.siteId,
      operatorId: values.operatorId || undefined,
      startDate: new Date(values.startDate).toISOString(),
      expectedReturnDate: values.expectedReturnDate ? new Date(values.expectedReturnDate).toISOString() : undefined,
      notes: values.notes || undefined,
    };

    if (useMockData) {
      alert('Mock Mode: Machine successfully assigned to projectsite!');
      router.push(`/dashboard/machinery/${machineId}`);
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiFetch(`${apiUrl}/machinery/${machineId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to assign heavy machinery');
      }

      router.push(`/dashboard/machinery/${machineId}`);
    } catch (err: any) {
      console.error('Submit Error:', err);
      setSubmitError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingForm) {
    return <LoadingState message="Fetching current projects and personnel rosters..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/machinery/${machineId}`}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs text-slate-500 font-medium">Back to Machine Details</span>
      </div>

      <PageHeader
        title="Deploy Heavy Machinery"
        description="Assign this heavy asset to an active project site compound and register an operator checked out for this shift."
      />

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium">
          {submitError}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-slate-900">
            <Link2 size={16} className="text-[#0284c7]" />
            Deployment Assignment Details
          </CardTitle>
          <CardDescription>Assigning a machine completes any active assignments on this machine.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Briefcase size={14} className="text-slate-400" /> Destination Project *
                </label>
                <select
                  {...register('projectId')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.projectId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400" /> Target Site Location *
                </label>
                <select
                  {...register('siteId')}
                  disabled={!selectedProjectId}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white disabled:opacity-50"
                >
                  <option value="">Choose Site Compound...</option>
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
                {errors.siteId && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.siteId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <User size={14} className="text-slate-400" /> Check out Operator
                </label>
                <select
                  {...register('operatorId')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-[#1f2937] bg-white"
                >
                  <option value="">Unassigned operator...</option>
                  {operators.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.firstName} {o.lastName} ({o.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" /> Deployment Start Date *
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.startDate && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" /> Expected Return Date
                </label>
                <input
                  type="date"
                  {...register('expectedReturnDate')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.expectedReturnDate && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.expectedReturnDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-4">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FileText size={14} className="text-slate-400" /> Deployment notes / Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Log checkout fuel levels, current operating hours, or special site directions..."
                {...register('notes')}
                className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href={`/dashboard/machinery/${machineId}`}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#0284c7] hover:bg-[#0275b0] text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Deploying...' : 'Deploy Machinery'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
