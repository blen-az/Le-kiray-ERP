'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function EditTenderPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="tenders:update">
      {children}
    </RequirePermission>
  );
}
