'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewLeavePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="leave:create">
      {children}
    </RequirePermission>
  );
}
