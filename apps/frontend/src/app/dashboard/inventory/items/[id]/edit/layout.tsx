'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function EditItemPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="inventory:update">
      {children}
    </RequirePermission>
  );
}
