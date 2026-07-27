'use client';

import RequirePermission from '../../../components/auth/RequirePermission';

export default function FuelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={['fuel:view', 'fuel:request']}>
      {children}
    </RequirePermission>
  );
}
