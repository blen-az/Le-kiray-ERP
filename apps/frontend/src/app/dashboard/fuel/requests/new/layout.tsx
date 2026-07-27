'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewFuelRequestLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission permission="fuel:request">
      {children}
    </RequirePermission>
  );
}
