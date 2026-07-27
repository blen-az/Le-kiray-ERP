'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function EditEmployeePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="hr:update">
      {children}
    </RequirePermission>
  );
}
