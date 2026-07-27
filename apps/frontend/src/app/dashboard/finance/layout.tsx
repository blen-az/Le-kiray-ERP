'use client';

import RequirePermission from '../../../components/auth/RequirePermission';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="finance:view">
      {children}
    </RequirePermission>
  );
}
