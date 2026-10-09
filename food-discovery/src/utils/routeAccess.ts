import type { UserRole } from '@/types/inventory'

export function hasRequiredRole(userRole: UserRole | null, allowedRoles?: UserRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }

  if (!userRole) {
    return false
  }

  return allowedRoles.includes(userRole)
}

export function canAccessRoute(
  isAuthenticated: boolean,
  userRole: UserRole | null,
  requiresAuth: boolean,
  allowedRoles?: UserRole[],
): boolean {
  if (!requiresAuth) {
    return true
  }

  if (!isAuthenticated) {
    return false
  }

  return hasRequiredRole(userRole, allowedRoles)
}
