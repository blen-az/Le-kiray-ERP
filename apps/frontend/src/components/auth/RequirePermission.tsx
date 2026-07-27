'use client';

import React from 'react';
import { useAuth } from '../../lib/auth';
import AccessDenied from './AccessDenied';

interface RequirePermissionProps {
  /** Single permission string */
  permission?: string;
  /** Require at least one of these permissions */
  anyOf?: string[];
  /** Require ALL of these permissions */
  allOf?: string[];
  /** CEO / Owner only — bypasses permission checks */
  ceoOnly?: boolean;
  children: React.ReactNode;
  /** Show compact denied message instead of full-page one */
  compact?: boolean;
  /** Custom fallback component */
  fallback?: React.ReactNode;
}

/**
 * Wraps children and shows AccessDenied if the user lacks the required permissions.
 *
 * Usage:
 *   <RequirePermission permission="projects:create">
 *     <CreateButton />
 *   </RequirePermission>
 *
 *   <RequirePermission anyOf={['hr:view', 'attendance:view']}>
 *     <HRPage />
 *   </RequirePermission>
 */
export default function RequirePermission({
  permission,
  anyOf,
  allOf,
  ceoOnly,
  children,
  compact = false,
  fallback,
}: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isCEO, isLoading } = useAuth();

  // While loading auth state, render nothing (avoids flash of denied)
  if (isLoading) return null;

  let allowed = false;

  if (ceoOnly) {
    allowed = isCEO();
  } else if (permission) {
    allowed = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    allowed = hasAnyPermission(anyOf);
  } else if (allOf && allOf.length > 0) {
    allowed = hasAllPermissions(allOf);
  } else {
    // No restriction specified — allow
    allowed = true;
  }

  if (!allowed) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <AccessDenied
        permission={permission ?? anyOf?.[0] ?? allOf?.[0]}
        compact={compact}
      />
    );
  }

  return <>{children}</>;
}

/**
 * Conditionally renders children only if user has permission.
 * Returns null (no UI at all) if denied. Good for hiding buttons.
 */
export function PermissionGate({
  permission,
  anyOf,
  ceoOnly,
  children,
}: Omit<RequirePermissionProps, 'compact' | 'fallback' | 'allOf'>) {
  const { hasPermission, hasAnyPermission, isCEO, isLoading } = useAuth();

  if (isLoading) return null;

  let allowed = false;
  if (ceoOnly) {
    allowed = isCEO();
  } else if (permission) {
    allowed = hasPermission(permission);
  } else if (anyOf) {
    allowed = hasAnyPermission(anyOf);
  } else {
    allowed = true;
  }

  return allowed ? <>{children}</> : null;
}
