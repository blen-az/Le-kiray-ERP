'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="users:view">
      {children}
    </RequirePermission>
  );
}
