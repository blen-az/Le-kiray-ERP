'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function EditProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="projects:update">
      {children}
    </RequirePermission>
  );
}
