'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewMachineLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="machinery:create">
      {children}
    </RequirePermission>
  );
}
