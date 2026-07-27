'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewInventoryRequestPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="inventory:request">
      {children}
    </RequirePermission>
  );
}
