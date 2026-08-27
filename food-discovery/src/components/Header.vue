<script setup lang="ts">
import { computed } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
// import { useRoute } from 'vue-router'

// const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Docs',
    to: 'https://go.nuxt.com/figma-ui',
    target: '_blank',
    icon: 'i-lucide-book-open',
    // to: '/docs/getting-started',
    // active: route.path.startsWith('/docs/getting-started'),
  },
  {
    label: 'Components',
    to: 'https://go.nuxt.com/figma-ui',
    target: '_blank',
    icon: 'i-lucide-box',
    // to: '/docs/components',
    // active: route.path.startsWith('/docs/components'),
  },
  {
    label: 'Figma',
    icon: 'i-simple-icons-figma',
    to: 'https://go.nuxt.com/figma-ui',
    target: '_blank',
  },
  {
    label: 'Releases',
    icon: 'i-lucide-rocket',
    to: 'https://github.com/nuxt/ui/releases',
    target: '_blank',
  },
])
</script>

<template>
  <UHeader toggle-side="left">
    <template #title>
      <img alt="foodDiscoveryLogo" src="/Food_Discovery.jpeg" class="h-12 w-auto" />
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />

      <UButton
        color="neutral"
        variant="ghost"
        to="https://github.com/nuxt/ui"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
      />
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
