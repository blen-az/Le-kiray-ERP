'use client';

import RequirePermission from '../../../components/auth/RequirePermission';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="projects:view">
      {children}
    </RequirePermission>
  );
}
