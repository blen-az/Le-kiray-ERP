'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Briefcase, Calendar, MapPin, DollarSign, User, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';

// Schema Validation
const projectSchema = z.object({
  projectName: z.string().min(1, { message: 'Project name is required' }),
  projectCode: z.string().optional(),
  clientName: z.string().optional(),
  location: z.string().min(1, { message: 'Location is required' }),
  regionOrCity: z.string().optional(),
  status: z.enum(['Planning', 'Active', 'On Track', 'At Risk', 'Delayed', 'Completed', 'Suspended', 'Cancelled']),
  progressPercentage: z.coerce.number().min(0, { message: 'Progress cannot be negative' }).max(100, { message: 'Progress cannot exceed 100' }).default(0),
  budget: z.coerce.number().min(0, { message: 'Budget cannot be negative' }).default(0),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  projectManagerId: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date cannot be before start date',
  path: ['endDate'],
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const mockManagers: Manager[] = [
  { id: 'pm-1', firstName: 'Daniel', lastName: 'Solomon', email: 'daniel@abccomp.com' },
  { id: 'pm-2', firstName: 'Kerealem', lastName: 'Lemma', email: 'kerealem@abccomp.com' },
  { id: 'pm-3', firstName: 'Hana', lastName: 'Tekle', email: 'hana@abccomp.com' },
];

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [managers, setManagers] = useState<Manager[]>(mockManagers);
  const [loadingProject, setLoadingProject] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  });

  // Load Managers
  useEffect(() => {
    async function loadManagers() {
      if (useMockData) return;
      try {
        const res = await fetch(`${apiUrl}/projects/users/managers`);
        if (res.ok) {
          const data = await res.json();
          setManagers(data);
        }
      } catch (err) {
        console.warn('Could not fetch real managers list, utilizing fallback seeds:', err);
      }
    }
    loadManagers();
  }, [useMockData, apiUrl]);

  // Load Project Details
  useEffect(() => {
    async function loadProject() {
      if (useMockData) {
        // Fallback populating
        reset({
          projectName: 'Bole Road Expansion',
          projectCode: 'PRJ-BOLE-001',
          clientName: 'Addis Ababa City Administration',
          location: 'Bole, Addis Ababa',
          regionOrCity: 'Addis Ababa',
          status: 'Active',
          progressPercentage: 68,
          budget: 45000000.0,
          startDate: '2025-01-10',
          endDate: '2026-03-15',
          projectManagerId: 'pm-1',
          description: 'Detailed road expansion project.',
        });
        setLoadingProject(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/projects/${projectId}`);
        if (!res.ok) throw new Error('Project not found or service connection failed');
        const p = await res.json();
        
        reset({
          projectName: p.projectName,
          projectCode: p.projectCode || '',
          clientName: p.clientName || '',
          location: p.location,
          regionOrCity: p.regionOrCity || '',
          status: p.status as any,
          progressPercentage: p.progressPercentage,
          budget: p.budget,
          startDate: p.startDate ? p.startDate.split('T')[0] : '',
          endDate: p.endDate ? p.endDate.split('T')[0] : '',
          projectManagerId: p.projectManagerId || '',
          description: p.description || '',
        });
      } catch (err: any) {
        console.error('Fetch Error:', err);
        setSubmitError(err.message || 'Error loading project parameters.');
      } finally {
        setLoadingProject(false);
      }
    }
    loadProject();
  }, [useMockData, apiUrl, projectId, reset]);

  const onSubmit = async (values: ProjectFormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      ...values,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
      endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
      projectManagerId: values.projectManagerId || null,
      description: values.description || null,
    };

    if (useMockData) {
      alert('Mock Mode: Project updated successfully!');
      router.push(`/dashboard/projects/${projectId}`);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to modify project details on server');
      }

      router.push(`/dashboard/projects/${projectId}`);
    } catch (err: any) {
      console.error('Submit Error:', err);
      setSubmitError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProject) {
    return <LoadingState message="Fetching project parameters..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs text-slate-500 font-medium">Back to Project Details</span>
      </div>

      <PageHeader
        title="Edit Project Workspace"
        description="Update contract scope budgets, schedule timeline, and manage assignment managers."
      />

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium">
          {submitError}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-slate-900">
            <Briefcase size={16} className="text-[#0284c7]" />
            Contract Information
          </CardTitle>
          <CardDescription>Update details of the current construction contract.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bole Road Expansion"
                  {...register('projectName')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.projectName && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.projectName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Project Code (Internal tracking)</label>
                <input
                  type="text"
                  placeholder="e.g. PRJ-BOLE-001"
                  {...register('projectCode')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Client / Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ministry of Transport"
                  {...register('clientName')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Status *</label>
                <select
                  {...register('status')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                >
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400" /> Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bole Road, Olympia"
                  {...register('location')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.location && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Region / City Division</label>
                <input
                  type="text"
                  placeholder="e.g. Addis Ababa"
                  {...register('regionOrCity')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <DollarSign size={14} className="text-slate-400" /> Total Contract Budget (ETB)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  {...register('budget')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.budget && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.budget.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Progress Percentage (0-100)</label>
                <input
                  type="number"
                  placeholder="0"
                  {...register('progressPercentage')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.progressPercentage && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.progressPercentage.message}</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" /> Start Date
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" /> End Date
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.endDate && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.endDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <User size={14} className="text-slate-400" /> Assign Project Manager
                </label>
                <select
                  {...register('projectManagerId')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                >
                  <option value="">Choose PM User...</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FileText size={14} className="text-slate-400" /> Project Description
              </label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href={`/dashboard/projects/${projectId}`}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#0284c7] hover:bg-[#0275b0] text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
