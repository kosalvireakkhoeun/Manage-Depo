<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import appLogo from '@/assets/logo.jpeg'

const router = useRouter()
const authStore = useAuthStore()
const { isDarkTheme, initializeTheme, toggleTheme } = useTheme()

const form = reactive({
  email: '',
  password: '',
})

const errorMessage = ref<string | null>(null)
const isSubmitting = ref(false)

const canSubmit = computed(() => form.email.trim().length > 3 && form.password.length > 5)

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      void router.replace(authStore.isAdmin ? '/dashboard' : '/inventory')
    }
  },
  { immediate: true },
)

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  const signInError = await authStore.signIn(form.email, form.password)

  if (signInError) {
    errorMessage.value = signInError
    isSubmitting.value = false
    return
  }

  await router.push('/inventory')
  isSubmitting.value = false
}

onMounted(() => {
  initializeTheme()
})
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-neutral-100 px-4 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
  >
    <div class="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <img :src="appLogo" alt="Inventory Store logo" class="mb-3 h-12 w-auto rounded-md" />
          <h1 class="text-2xl font-bold">Inventory Management</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Sign in to continue</p>
        </div>

        <button
          type="button"
          class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          @click="toggleTheme"
        >
          {{ isDarkTheme ? 'Light' : 'Dark' }}
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium">Email</label>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Password</label>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="errorMessage" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-200">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          :disabled="!canSubmit || isSubmitting"
        >
          {{ isSubmitting ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>