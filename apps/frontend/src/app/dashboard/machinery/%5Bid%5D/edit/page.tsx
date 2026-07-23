'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Truck, Calendar, Shield, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';

const machineSchema = z.object({
  machineType: z.string().min(1, { message: 'Machine type is required' }),
  brand: z.string().min(1, { message: 'Brand is required' }),
  model: z.string().min(1, { message: 'Model is required' }),
  plateNumber: z.string().optional().or(z.literal('')),
  serialNumber: z.string().optional().or(z.literal('')),
  capacity: z.string().optional().or(z.literal('')),
  ownershipType: z.enum(['Owned', 'Rented from Le’Kiray Marketplace', 'Rented Externally']),
  source: z.enum(['Internal Fleet', 'Le’Kiray Marketplace', 'External Rental Provider']),
  currentStatus: z.enum(['Available', 'Assigned', 'Active', 'Idle', 'Under Maintenance', 'Returned', 'Out of Service']),
  rentalStartDate: z.string().optional().or(z.literal('')),
  rentalEndDate: z.string().optional().or(z.literal('')),
  dailyRentalCost: z.coerce.number().min(0, { message: 'Daily rental cost cannot be negative' }).default(0),
  hourlyRentalCost: z.coerce.number().min(0, { message: 'Hourly rental cost cannot be negative' }).default(0),
  notes: z.string().optional().or(z.literal('')),
}).refine((data) => {
  return !!data.plateNumber || !!data.serialNumber;
}, {
  message: 'Plate number or serial number should be provided',
  path: ['plateNumber'],
}).refine((data) => {
  if (data.ownershipType !== 'Owned') {
    return !!data.rentalStartDate && !!data.rentalEndDate;
  }
  return true;
}, {
  message: 'Rental start and end dates are required if machine is rented',
  path: ['rentalStartDate'],
}).refine((data) => {
  if (data.rentalStartDate && data.rentalEndDate) {
    return new Date(data.rentalEndDate) >= new Date(data.rentalStartDate);
  }
  return true;
}, {
  message: 'Rental end date cannot be before start date',
  path: ['rentalEndDate'],
});

type MachineFormValues = z.infer<typeof machineSchema>;

export default function EditMachinePage() {
  const router = useRouter();
  const params = useParams();
  const machineId = params.id as string;

  const [loadingMachine, setLoadingMachine] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MachineFormValues>({
    resolver: zodResolver(machineSchema),
  });

  const ownershipType = watch('ownershipType');
  const showRentalFields = ownershipType !== 'Owned';

  useEffect(() => {
    async function loadMachine() {
      if (useMockData) {
        reset({
          machineType: 'Excavator',
          brand: 'CAT',
          model: '320D',
          plateNumber: 'ET-3-A1234',
          serialNumber: 'SN-CAT320D-9988',
          capacity: '20 Tons',
          ownershipType: 'Owned',
          source: 'Internal Fleet',
          currentStatus: 'Active',
          rentalStartDate: '',
          rentalEndDate: '',
          dailyRentalCost: 0,
          hourlyRentalCost: 0,
          notes: 'Primary heavy excavator, in good working condition.',
        });
        setLoadingMachine(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/machinery/${machineId}`);
        if (!res.ok) throw new Error('Machine not found or API endpoint error');
        const m = await res.json();

        reset({
          machineType: m.machineType,
          brand: m.brand,
          model: m.model,
          plateNumber: m.plateNumber || '',
          serialNumber: m.serialNumber || '',
          capacity: m.capacity || '',
          ownershipType: m.ownershipType as any,
          source: m.source as any,
          currentStatus: m.currentStatus as any,
          rentalStartDate: m.rentalStartDate ? m.rentalStartDate.split('T')[0] : '',
          rentalEndDate: m.rentalEndDate ? m.rentalEndDate.split('T')[0] : '',
          dailyRentalCost: m.dailyRentalCost,
          hourlyRentalCost: m.hourlyRentalCost,
          notes: m.notes || '',
        });
      } catch (err: any) {
        console.error('Fetch Error:', err);
        setSubmitError(err.message || 'Error fetching machine details');
      } finally {
        setLoadingMachine(false);
      }
    }
    loadMachine();
  }, [useMockData, apiUrl, machineId, reset]);

  const onSubmit = async (values: MachineFormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      ...values,
      plateNumber: values.plateNumber || null,
      serialNumber: values.serialNumber || null,
      capacity: values.capacity || null,
      rentalStartDate: showRentalFields && values.rentalStartDate ? new Date(values.rentalStartDate).toISOString() : null,
      rentalEndDate: showRentalFields && values.rentalEndDate ? new Date(values.rentalEndDate).toISOString() : null,
      dailyRentalCost: showRentalFields ? values.dailyRentalCost : 0,
      hourlyRentalCost: showRentalFields ? values.hourlyRentalCost : 0,
      notes: values.notes || null,
    };

    if (useMockData) {
      alert('Mock Mode: Machinery updated successfully!');
      router.push(`/dashboard/machinery/${machineId}`);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/machinery/${machineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to modify machinery details on NestJS server');
      }

      router.push(`/dashboard/machinery/${machineId}`);
    } catch (err: any) {
      console.error('Submit Error:', err);
      setSubmitError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMachine) {
    return <LoadingState message="Fetching heavy machinery details..." />;
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
        title="Edit Machinery Details"
        description="Modify technical parameters, current status, and lease parameters."
      />

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium">
          {submitError}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-slate-900">
            <Truck size={16} className="text-[#0284c7]" />
            Asset Specifications
          </CardTitle>
          <CardDescription>Update details for this equipment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Machine Type *</label>
                <select
                  {...register('machineType')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                >
                  <option value="Excavator">Excavator</option>
                  <option value="Loader">Loader</option>
                  <option value="Bulldozer">Bulldozer</option>
                  <option value="Grader">Grader</option>
                  <option value="Roller">Roller</option>
                  <option value="Crane">Crane</option>
                  <option value="Dump Truck">Dump Truck</option>
                  <option value="Concrete Mixer">Concrete Mixer</option>
                  <option value="Generator">Generator</option>
                  <option value="Compressor">Compressor</option>
                  <option value="Water Truck">Water Truck</option>
                  <option value="Forklift">Forklift</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Brand / Make *</label>
                <input
                  type="text"
                  placeholder="e.g. CAT"
                  {...register('brand')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.brand && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Model *</label>
                <input
                  type="text"
                  placeholder="e.g. 320D"
                  {...register('model')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.model && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.model.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Plate Number *</label>
                <input
                  type="text"
                  placeholder="e.g. ET-3-A1234"
                  {...register('plateNumber')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
                {errors.plateNumber && (
                  <p className="text-[10px] text-rose-600 font-bold">{errors.plateNumber.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Chassis / Serial Number *</label>
                <input
                  type="text"
                  placeholder="e.g. SN-CAT320D-XXXX"
                  {...register('serialNumber')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Capacity</label>
                <input
                  type="text"
                  placeholder="e.g. 20 Tons"
                  {...register('capacity')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Ownership Type *</label>
                <select
                  {...register('ownershipType')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                >
                  <option value="Owned">Owned</option>
                  <option value="Rented from Le’Kiray Marketplace">Rented from Le’Kiray Marketplace</option>
                  <option value="Rented Externally">Rented Externally</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Source *</label>
                <select
                  {...register('source')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                >
                  <option value="Internal Fleet">Internal Fleet</option>
                  <option value="Le’Kiray Marketplace">Le’Kiray Marketplace</option>
                  <option value="External Rental Provider">External Rental Provider</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Fleet Status *</label>
                <select
                  {...register('currentStatus')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="Idle">Idle</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                  <option value="Active">Active</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
            </div>

            {showRentalFields && (
              <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-lg space-y-4 animate-fadeIn border-t">
                <div className="flex items-center gap-1.5 text-slate-800 text-xs font-bold">
                  <Shield size={15} className="text-[#0284c7]" />
                  Rental Contract parameters
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Rental Start Date *</label>
                    <input
                      type="date"
                      {...register('rentalStartDate')}
                      className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                    />
                    {errors.rentalStartDate && (
                      <p className="text-[10px] text-rose-600 font-bold">{errors.rentalStartDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Rental End Date *</label>
                    <input
                      type="date"
                      {...register('rentalEndDate')}
                      className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                    />
                    {errors.rentalEndDate && (
                      <p className="text-[10px] text-rose-600 font-bold">{errors.rentalEndDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Daily Rate (ETB)</label>
                    <input
                      type="number"
                      {...register('dailyRentalCost')}
                      className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Hourly Rate (ETB)</label>
                    <input
                      type="number"
                      {...register('hourlyRentalCost')}
                      className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 border-t border-slate-100 pt-4">
              <label className="text-xs font-semibold text-slate-700">Notes</label>
              <textarea
                rows={3}
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
                {submitting ? 'Saving changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
