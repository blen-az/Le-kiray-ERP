'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewMaintenancePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="maintenance:create">
      {children}
    </RequirePermission>
  );
}
