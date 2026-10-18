'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewTenderPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="tenders:create">
      {children}
    </RequirePermission>
  );
}
