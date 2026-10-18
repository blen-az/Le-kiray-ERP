'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function TendersLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="tenders:view">
      {children}
    </RequirePermission>
  );
}
