'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function EditMachineLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="machinery:update">
      {children}
    </RequirePermission>
  );
}
