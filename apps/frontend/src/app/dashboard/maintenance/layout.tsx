'use client';

import RequirePermission from '../../../components/auth/RequirePermission';

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="maintenance:view">
      {children}
    </RequirePermission>
  );
}
