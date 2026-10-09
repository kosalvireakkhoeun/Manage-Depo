import { readonly, ref } from 'vue'

const THEME_STORAGE_KEY = 'inventory-management-theme'
const isDarkTheme = ref(false)
const isThemeInitialized = ref(false)

function persistTheme(value: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', value)
}

export function useTheme() {
  function initializeTheme() {
    if (isThemeInitialized.value || typeof window === 'undefined') {
      return
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

    if (savedTheme === 'dark') {
      isDarkTheme.value = true
    } else if (savedTheme === 'light') {
      isDarkTheme.value = false
    } else {
      isDarkTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    persistTheme(isDarkTheme.value)
    isThemeInitialized.value = true
  }

  function toggleTheme() {
    isDarkTheme.value = !isDarkTheme.value
    persistTheme(isDarkTheme.value)
  }

  return {
    isDarkTheme: readonly(isDarkTheme),
    initializeTheme,
    toggleTheme,
  }
}
