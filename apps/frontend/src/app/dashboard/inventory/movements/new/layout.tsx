'use client';

import RequirePermission from '@/components/auth/RequirePermission';

export default function NewMovementPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={['inventory:stock_in', 'inventory:stock_out', 'inventory:transfer', 'inventory:adjust', 'inventory:create']}>
      {children}
    </RequirePermission>
  );
}
