'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewExpensePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="finance:create">
      {children}
    </RequirePermission>
  );
}
