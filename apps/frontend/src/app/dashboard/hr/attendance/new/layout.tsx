'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewAttendancePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="attendance:create">
      {children}
    </RequirePermission>
  );
}
