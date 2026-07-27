'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function EditExpensePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="finance:update">
      {children}
    </RequirePermission>
  );
}
