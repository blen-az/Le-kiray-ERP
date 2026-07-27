'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function EditDailyReportPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="reports:update">
      {children}
    </RequirePermission>
  );
}
