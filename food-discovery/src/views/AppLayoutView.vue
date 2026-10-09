<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { UserRole } from '@/types/inventory'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'

interface NavigationItem {
  label: string
  to: string
  roles?: UserRole[]
}

const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', to: '/dashboard', roles: ['admin'] },
  { label: 'Inventory', to: '/inventory' },
  { label: 'Categories', to: '/categories', roles: ['admin'] },
  { label: 'User Roles', to: '/user-roles', roles: ['admin'] },
]

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isDarkTheme, initializeTheme, toggleTheme } = useTheme()

const isSidebarOpen = ref(false)

const visibleNavigationItems = computed(() =>
  navigationItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true
    }

    return authStore.role ? item.roles.includes(authStore.role) : false
  }),
)

const pageTitle = computed(() => {
  const title = route.meta.title
  return title ? String(title) : 'Inventory'
})

const userEmail = computed(() => authStore.profile?.email ?? authStore.user?.email ?? 'User')
const userRoleLabel = computed(() => (authStore.role === 'admin' ? 'Admin' : 'Staff'))

function closeSidebar() {
  isSidebarOpen.value = false
}

async function handleSignOut() {
  await authStore.signOut()
  await router.push('/login')
}

onMounted(() => {
  initializeTheme()
})
</script>

<template>
  <div class="min-h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
    <div class="flex min-h-screen">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-30 bg-black/50 md:hidden"
        @click="closeSidebar"
      />

      <aside
        class="fixed inset-y-0 left-0 z-40 w-64 transform border-r border-neutral-200 bg-white px-4 py-6 transition-transform dark:border-neutral-800 dark:bg-neutral-950 md:static md:translate-x-0"
        :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="mb-8">
          <h1 class="text-lg font-semibold">Inventory Store</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Management Portal</p>
        </div>

        <nav class="space-y-2">
          <RouterLink
            v-for="item in visibleNavigationItems"
            :key="item.to"
            :to="item.to"
            class="block rounded-md px-3 py-2 text-sm font-medium transition-colors"
            :class="
              route.path === item.to
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-800'
            "
            @click="closeSidebar"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </aside>

      <div class="flex min-h-screen flex-1 flex-col md:ml-0">
        <header
          class="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950 md:px-6"
        >
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 md:hidden"
              @click="isSidebarOpen = true"
            >
              Menu
            </button>
            <h2 class="text-lg font-semibold">{{ pageTitle }}</h2>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
              @click="toggleTheme"
            >
              {{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}
            </button>

            <details class="relative">
              <summary
                class="cursor-pointer list-none rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
              >
                {{ userRoleLabel }}
              </summary>
              <div
                class="absolute right-0 mt-2 w-52 rounded-md border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
              >
                <p class="truncate text-sm text-neutral-600 dark:text-neutral-300">{{ userEmail }}</p>
                <button
                  type="button"
                  class="mt-3 w-full rounded-md bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
                  @click="handleSignOut"
                >
                  Logout
                </button>
              </div>
            </details>
          </div>
        </header>

        <main class="flex-1 p-4 md:p-6">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>