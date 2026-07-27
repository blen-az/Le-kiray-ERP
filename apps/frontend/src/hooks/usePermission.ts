'use client';

import { useCallback } from 'react';
import { useAuth } from '../lib/auth';

/**
 * Returns true if the current user has the given permission.
 * CEO / Owner and Super Admin always return true.
 */
export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Returns true if the current user has at least one of the given permissions.
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(permissions);
}

/**
 * Returns true if the current user has all of the given permissions.
 */
export function useAllPermissions(permissions: string[]): boolean {
  const { hasAllPermissions } = useAuth();
  return hasAllPermissions(permissions);
}

/**
 * Returns the full set of auth helpers as a stable object.
 * Useful when a component needs multiple permission checks.
 */
export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, isCEO, user } = useAuth();

  const can = useCallback((permission: string) => hasPermission(permission), [hasPermission]);
  const canAny = useCallback((perms: string[]) => hasAnyPermission(perms), [hasAnyPermission]);
  const canAll = useCallback((perms: string[]) => hasAllPermissions(perms), [hasAllPermissions]);
  const is = useCallback((role: string) => hasRole(role), [hasRole]);

  return { can, canAny, canAll, is, isCEO, user };
}
