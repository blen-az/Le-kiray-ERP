'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewWarehousePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="inventory:create">
      {children}
    </RequirePermission>
  );
}
