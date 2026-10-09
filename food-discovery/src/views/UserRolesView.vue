<script setup lang="ts">
import { onMounted } from 'vue'
import type { Profile, UserRole } from '@/types/inventory'
import { useInventoryStore } from '@/stores/inventory'

const inventoryStore = useInventoryStore()

async function changeRole(profile: Profile, role: UserRole) {
  if (profile.role === role) {
    return
  }

  try {
    await inventoryStore.changeUserRole(profile.id, role)
  } catch {
    // error state is shown from store
  }
}

onMounted(async () => {
  await inventoryStore.fetchProfiles()
})
</script>

<template>
  <section class="space-y-4">
    <article class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h3 class="text-lg font-semibold">User Role Management</h3>
      <p class="text-sm text-neutral-500 dark:text-neutral-400">
        Toggle each account role between staff and admin.
      </p>
    </article>

    <p v-if="inventoryStore.error" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-200">
      {{ inventoryStore.error }}
    </p>

    <article class="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <table class="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
        <thead>
          <tr class="text-left text-xs uppercase text-neutral-500 dark:text-neutral-400">
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Current Role</th>
            <th class="px-4 py-3">Created</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
          <tr v-for="profile in inventoryStore.profiles" :key="profile.id">
            <td class="px-4 py-3">{{ profile.email || 'No email' }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-1 text-xs font-semibold"
                :class="
                  profile.role === 'admin'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'
                    : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                "
              >
                {{ profile.role }}
              </span>
            </td>
            <td class="px-4 py-3">{{ new Date(profile.created_at).toLocaleDateString() }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
                  :disabled="inventoryStore.submitting"
                  @click="changeRole(profile, 'staff')"
                >
                  Set Staff
                </button>
                <button
                  type="button"
                  class="rounded-md border border-indigo-300 px-3 py-1 text-xs text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"
                  :disabled="inventoryStore.submitting"
                  @click="changeRole(profile, 'admin')"
                >
                  Set Admin
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="!inventoryStore.loadingProfiles && inventoryStore.profiles.length === 0"
        class="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400"
      >
        No users available.
      </div>
    </article>
  </section>
</template>