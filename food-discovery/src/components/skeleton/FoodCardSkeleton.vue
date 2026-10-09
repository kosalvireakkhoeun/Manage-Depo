<script setup lang="ts"></script>

<template>
  <UCard class="group hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
    <div
      class="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-neutral-100 dark:bg-neutral-800 mb-2"
    >
      <USkeleton class="size-12" />
    </div>

    <div class="p-1 flex-1 flex flex-col gap-4">
      <USkeleton class="h-4 w-2/3" />

      <div class="flex flex-col gap-2">
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-4/5" />
      </div>

      <USkeleton class="h-4 w-1/2" />
    </div>
  </UCard>
</template>

<style scoped>
:deep(div[data-slot='body']) {
  padding: calc(var(--spacing) * 4) !important;
}
</style>
