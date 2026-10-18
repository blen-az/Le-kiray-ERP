'use client';

import AccessDenied from '@/components/auth/AccessDenied';
import { useAuth } from '@/lib/auth';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  // UX gate only — every /platform API route is enforced server-side by PlatformAdminGuard
  if (!user?.isPlatformAdmin) return <AccessDenied permission="platform admin" />;
  return <>{children}</>;
}
