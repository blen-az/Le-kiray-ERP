'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="projects:create">
      {children}
    </RequirePermission>
  );
}
