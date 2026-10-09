import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/inventory'
import { canAccessRoute } from '@/utils/routeAccess'

const appTitle = 'Inventory Management Store'

function getDefaultRoute(role: UserRole | null) {
  return role === 'admin' ? '/dashboard' : '/inventory'
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      guestOnly: true,
      title: 'Login',
    },
  },
  {
    path: '/',
    component: () => import('@/views/AppLayoutView.vue'),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: '/inventory',
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('@/views/InventoryView.vue'),
        meta: {
          title: 'Inventory',
        },
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: {
          title: 'Dashboard',
          roles: ['admin'] as UserRole[],
        },
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('@/views/CategoriesView.vue'),
        meta: {
          title: 'Categories',
          roles: ['admin'] as UserRole[],
        },
      },
      {
        path: 'user-roles',
        name: 'user-roles',
        component: () => import('@/views/UserRolesView.vue'),
        meta: {
          title: 'User Roles',
          roles: ['admin'] as UserRole[],
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/inventory',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.initialize()

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { path: getDefaultRoute(authStore.role) }
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiredRoles = to.matched
    .flatMap((record) => (record.meta.roles as UserRole[] | undefined) ?? [])
    .filter((value, index, self) => self.indexOf(value) === index)

  const hasAccess = canAccessRoute(
    authStore.isAuthenticated,
    authStore.role,
    requiresAuth,
    requiredRoles.length > 0 ? requiredRoles : undefined,
  )

  if (!hasAccess) {
    return {
      path: authStore.isAuthenticated ? getDefaultRoute(authStore.role) : '/login',
    }
  }

  return true
})

router.afterEach((to) => {
  const pageTitle = to.meta.title
  document.title = pageTitle ? `${String(pageTitle)} • ${appTitle}` : appTitle
})

export default router
