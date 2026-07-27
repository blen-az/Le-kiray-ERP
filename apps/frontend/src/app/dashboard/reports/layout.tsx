'use client';

import RequirePermission from '../../../components/auth/RequirePermission';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="reports:view">
      {children}
    </RequirePermission>
  );
}
