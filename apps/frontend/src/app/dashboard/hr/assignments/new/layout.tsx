'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewAssignmentPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="hr:assign">
      {children}
    </RequirePermission>
  );
}
