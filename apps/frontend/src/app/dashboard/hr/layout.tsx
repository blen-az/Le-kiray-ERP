'use client';

import RequirePermission from '../../../components/auth/RequirePermission';

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={['hr:view', 'attendance:view']}>
      {children}
    </RequirePermission>
  );
}
