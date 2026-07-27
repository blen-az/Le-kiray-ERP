'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewEmployeePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="hr:create">
      {children}
    </RequirePermission>
  );
}
