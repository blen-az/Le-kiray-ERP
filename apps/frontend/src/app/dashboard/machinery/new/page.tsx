'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Truck, Calendar, Shield, DollarSign, Info } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Validation Schema
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

export default function NewMachinePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MachineFormValues>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      machineType: 'Excavator',
      brand: '',
      model: '',
      plateNumber: '',
      serialNumber: '',
      capacity: '',
      ownershipType: 'Owned',
      source: 'Internal Fleet',
      currentStatus: 'Available',
      rentalStartDate: '',
      rentalEndDate: '',
      dailyRentalCost: 0,
      hourlyRentalCost: 0,
      notes: '',
    },
  });

  const ownershipType = watch('ownershipType');
  const showRentalFields = ownershipType !== 'Owned';

  const onSubmit = async (values: MachineFormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    // Parse values
    const payload = {
      ...values,
      plateNumber: values.plateNumber || undefined,
      serialNumber: values.serialNumber || undefined,
      capacity: values.capacity || undefined,
      rentalStartDate: showRentalFields && values.rentalStartDate ? new Date(values.rentalStartDate).toISOString() : undefined,
      rentalEndDate: showRentalFields && values.rentalEndDate ? new Date(values.rentalEndDate).toISOString() : undefined,
      dailyRentalCost: showRentalFields ? values.dailyRentalCost : 0,
      hourlyRentalCost: showRentalFields ? values.hourlyRentalCost : 0,
      notes: values.notes || undefined,
    };

    if (useMockData) {
      alert('Mock Mode: Heavy machinery registered successfully!');
      router.push('/dashboard/machinery');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/machinery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to register heavy machinery on NestJS server');
      }

      const savedMachine = await res.json();
      router.push(`/dashboard/machinery/${savedMachine.id}`);
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
          href="/dashboard/machinery"
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs text-slate-500 font-medium">Back to Machinery Fleet</span>
      </div>

      <PageHeader
        title="Register Heavy Machinery"
        description="Add a new owned asset, or map equipment rented from the Le’Kiray Marketplace / third-party supplier."
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
          <CardDescription>All fields marked with an asterisk (*) are mandatory.</CardDescription>
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
                  placeholder="e.g. CAT, Volvo, Komatsu"
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
                  placeholder="e.g. 320D, L90, PC200"
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
                <label className="text-xs font-semibold text-slate-700">Capacity (Operating weight/m3)</label>
                <input
                  type="text"
                  placeholder="e.g. 20 Tons, 10 m3"
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
                <label className="text-xs font-semibold text-slate-700">Initial Fleet Status *</label>
                <select
                  {...register('currentStatus')}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="Idle">Idle</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
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
                    <label className="font-semibold text-slate-700 flex items-center gap-0.5">
                      <DollarSign size={13} className="text-slate-400" /> Daily Rate (ETB)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      {...register('dailyRentalCost')}
                      className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                    />
                    {errors.dailyRentalCost && (
                      <p className="text-[10px] text-rose-600 font-bold">{errors.dailyRentalCost.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 flex items-center gap-0.5">
                      <DollarSign size={13} className="text-slate-400" /> Hourly Rate (ETB)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      {...register('hourlyRentalCost')}
                      className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white"
                    />
                    {errors.hourlyRentalCost && (
                      <p className="text-[10px] text-rose-600 font-bold">{errors.hourlyRentalCost.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 border-t border-slate-100 pt-4">
              <label className="text-xs font-semibold text-slate-700">Remarks & Internal Instructions</label>
              <textarea
                rows={3}
                placeholder="Log operator licenses required, hydraulic health conditions, or market provider phone details..."
                {...register('notes')}
                className="w-full py-2 px-3 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#0284c7] outline-none text-slate-700 bg-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard/machinery"
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#0284c7] hover:bg-[#0275b0] text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Registering...' : 'Register Machine'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
