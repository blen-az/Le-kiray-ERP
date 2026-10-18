'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TenderForm from '@/components/tenders/TenderForm';
import { apiRequest } from '@/lib/api';

export default function NewTenderPage() {
  const router = useRouter();

  const handleSubmit = async (payload: Record<string, unknown>) => {
    const created = await apiRequest<{ id: string }>('/tenders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    router.push(`/dashboard/tenders/${created.id}`);
  };

  return <TenderForm mode="create" backHref="/dashboard/tenders" onSubmit={handleSubmit} />;
}
