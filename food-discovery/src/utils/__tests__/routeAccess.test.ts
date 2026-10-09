import { describe, expect, it } from 'vitest'
import { canAccessRoute, hasRequiredRole } from '@/utils/routeAccess'

describe('hasRequiredRole', () => {
  it('allows when no role restriction is provided', () => {
    expect(hasRequiredRole('staff')).toBe(true)
    expect(hasRequiredRole(null)).toBe(true)
  })

  it('denies when user role is missing and route requires role', () => {
    expect(hasRequiredRole(null, ['admin'])).toBe(false)
  })

  it('allows only when role is included', () => {
    expect(hasRequiredRole('admin', ['admin'])).toBe(true)
    expect(hasRequiredRole('staff', ['admin'])).toBe(false)
  })
})

describe('canAccessRoute', () => {
  it('allows public routes for anyone', () => {
    expect(canAccessRoute(false, null, false)).toBe(true)
  })

  it('denies private routes for unauthenticated users', () => {
    expect(canAccessRoute(false, null, true)).toBe(false)
  })

  it('allows authenticated users when no role is required', () => {
    expect(canAccessRoute(true, 'staff', true)).toBe(true)
  })

  it('enforces role checks for protected admin routes', () => {
    expect(canAccessRoute(true, 'admin', true, ['admin'])).toBe(true)
    expect(canAccessRoute(true, 'staff', true, ['admin'])).toBe(false)
  })
})
