'use client';

import RequirePermission from '../../../components/auth/RequirePermission';

export default function MachineryLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="machinery:view">
      {children}
    </RequirePermission>
  );
}
