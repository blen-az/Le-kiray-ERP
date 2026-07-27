'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function AssignMachineLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="machinery:assign">
      {children}
    </RequirePermission>
  );
}
