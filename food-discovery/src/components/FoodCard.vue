<script setup lang="ts">
import type { FoodDiscovery } from '../utils/model/FoodDiscovery'

interface Props {
  food: FoodDiscovery
}

const props = defineProps<Props>()

function getThumbnailUrl(url?: string): string | null {
  if (!url) return null

  try {
    const urlObj = new URL(url)

    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = ''
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1)
      } else {
        videoId = urlObj.searchParams.get('v') || ''
      }
      if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }

    // Facebook
    if (urlObj.hostname.includes('facebook.com') || urlObj.hostname.includes('fb.watch')) {
      const videoIdMatch = url.match(/(?:videos?|watch|reel)[/?](\d+)/)
      if (videoIdMatch) return `https://graph.facebook.com/v18.0/${videoIdMatch[1]}/picture`
    }

    // TikTok
    if (urlObj.hostname.includes('tiktok.com')) {
      return url
    }

    return url
  } catch {
    return url
  }
}

function handleThumbnailClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (props.food.url) {
    window.open(props.food.url, '_blank', 'noopener,noreferrer')
  }
}
</script>

<template>
  <UCard class="group hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
    <div
      class="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-neutral-100 dark:bg-neutral-800"
    >
      <img
        v-if="getThumbnailUrl(food.thumbnail_url) || getThumbnailUrl(food.url)"
        :src="getThumbnailUrl(food.thumbnail_url) || getThumbnailUrl(food.url) || undefined"
        alt="Food thumbnail"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
        @click="handleThumbnailClick"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-neutral-400">
        <i class="i-lucide-image text-4xl" />
      </div>

      <div
        v-if="food.url"
        class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
        @click="handleThumbnailClick"
      >
        <UButton
          color="neutral"
          variant="outline"
          size="lg"
          icon="i-lucide-external-link"
          class="scale-90 group-hover:scale-100 transition-transform"
        />
      </div>
    </div>


    <div class="p-4 flex-1 flex flex-col">
      <div
        v-if="food.location"
        class="mb-2 flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400"
      >
        <UIcon name="i-lucide-map-pin" class="size-5" />
        <span class="truncate">{{ food.location }}</span>
      </div>

      <p
        v-if="food.notes"
        class="text-sm text-neutral-700 dark:text-neutral-300 flex-1"
      >
        {{ food.notes }}
      </p>

      <div v-if="food.created_at" class="mt-3 text-xs text-neutral-500 dark:text-neutral-500">
        {{ new Date(food.created_at).toDateString() }}
      </div>
    </div>
  </UCard>
</template>
