'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewDailyReportPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="reports:create">
      {children}
    </RequirePermission>
  );
}
