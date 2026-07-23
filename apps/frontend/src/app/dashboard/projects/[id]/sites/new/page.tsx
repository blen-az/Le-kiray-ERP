'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Building2, MapPin, Compass, User, Calendar, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Schema Validation
const siteSchema = z.object({
  siteName: z.string().min(1, { message: 'Site name is required' }),
  location: z.string().min(1, { message: 'Location is required' }),
  gpsLatitude: z.coerce.number().optional().or(z.literal('')),
  gpsLongitude: z.coerce.number().optional().or(z.literal('')),
  siteManagerId: z.string().optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive', 'Delayed', 'Completed', 'Suspended']),
  startDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
});

type SiteFormValues = z.infer<typeof siteSchema>;

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const mockManagers: Manager[] = [
  { id: 'sm-1', firstName: 'Abebe', lastName: 'Kebede', email: 'abebe@abccomp.com' },
  { id: 'sm-2', firstName: 'Almaz', lastName: 'Desta', email: 'almaz@abccomp.com' },
  { id: 'sm-3', firstName: 'Tariku', lastName: 'Mengistu', email: 'tariku@abccomp.com' },
];

export default function NewSitePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [managers, setManagers] = useState<Manager[]>(mockManagers);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      siteName: '',
      location: '',
      gpsLatitude: '',
      gpsLongitude: '',
      siteManagerId: '',
      status: 'Active',
      startDate: '',
      notes: '',
    },
  });

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

  const onSubmit = async (values: SiteFormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    // Parse coordinates and nullable values
    const payload = {
      siteName: values.siteName,
      location: values.location,
      gpsLatitude: values.gpsLatitude !== '' ? Number(values.gpsLatitude) : undefined,
      gpsLongitude: values.gpsLongitude !== '' ? Number(values.gpsLongitude) : undefined,
      siteManagerId: values.siteManagerId || undefined,
      status: values.status,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
      notes: values.notes || undefined,
    };

    if (useMockData) {
      alert('Mock Mode: Site compound created successfully!');
      router.push(`/dashboard/projects/${projectId}`);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/projects/${projectId}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create site plot in backend');
      }

      router.push(`/dashboard/projects/${projectId}`);
    } catch (err: any) {
      console.error('Submit Error:', err);
      setSubmitError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

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
        title="Add Site Compound"
        description="Establish a physical site office, excavation plot, or central supply depot tied to this contract."
      />

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium">
          {submitError}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-slate-900">
            <Building2 size={16} className="text-[#0284c7]" />
            Site Plot Parameters
          </CardTitle>
          <CardDescription>All fields marked with an asterisk (*) are mandatory.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Site Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bole Main Excavation Site"
                  {...register('siteName')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.siteName && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.siteName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Status *</label>
                <select
                  {...register('status')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400" /> Physical Location / Address *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bole Olympia Junction, Addis Ababa"
                  {...register('location')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.location && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Compass size={14} className="text-slate-400" /> GPS Latitude (Decimal degrees)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 9.0123"
                  {...register('gpsLatitude')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Compass size={14} className="text-slate-400" /> GPS Longitude (Decimal degrees)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 38.7456"
                  {...register('gpsLongitude')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <User size={14} className="text-slate-400" /> Assign Site Manager
                </label>
                <select
                  {...register('siteManagerId')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-[#1f2937] bg-white"
                >
                  <option value="">Choose Site Coordinator...</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" /> Operations Start Date
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FileText size={14} className="text-slate-400" /> Notes / Internal Instructions
              </label>
              <textarea
                rows={3}
                placeholder="List warehouse compounds, cement bag capacities, or operator check-in restrictions on site..."
                {...register('notes')}
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
                {submitting ? 'Creating Site Compound...' : 'Save & Add Site'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
