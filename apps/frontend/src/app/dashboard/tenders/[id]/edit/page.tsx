'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TenderForm, { TenderFormValues, tenderToFormValues } from '@/components/tenders/TenderForm';
import { LoadingState } from '@/components/ui/loading-state';
import { apiRequest } from '@/lib/api';

export default function EditTenderPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [initial, setInitial] = useState<TenderFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<any>(`/tenders/${id}`)
      .then((t) => setInitial(tenderToFormValues(t)))
      .catch((err) => setError(err.message || 'Failed to load tender'));
  }, [id]);

  const handleSubmit = async (payload: Record<string, unknown>) => {
    await apiRequest(`/tenders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    router.push(`/dashboard/tenders/${id}`);
  };

  if (error) {
    return <div className="p-4 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>;
  }
  if (!initial) return <LoadingState message="Loading tender..." />;

  return <TenderForm mode="edit" initial={initial} backHref={`/dashboard/tenders/${id}`} onSubmit={handleSubmit} />;
}
