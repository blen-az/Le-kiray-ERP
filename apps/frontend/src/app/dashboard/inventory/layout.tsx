'use client';

import RequirePermission from '../../../components/auth/RequirePermission';

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={['inventory:view', 'inventory:request']}>
      {children}
    </RequirePermission>
  );
}
