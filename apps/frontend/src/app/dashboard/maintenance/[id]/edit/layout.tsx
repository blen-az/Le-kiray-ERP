'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function EditMaintenancePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="maintenance:update">
      {children}
    </RequirePermission>
  );
}
