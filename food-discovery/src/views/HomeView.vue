<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import FoodCard from '../components/FoodCard.vue'
import type { FoodDiscovery } from '../utils/model/FoodDiscovery'

const foods = ref<FoodDiscovery[]>([])
const loading = ref(false)

async function getFoods() {
  loading.value = true
  const { data, error } = await supabase
    .from('food_spots')
    .select()
    .order('created_at', { ascending: false })
  if (!error && data != null) {
    foods.value = data
  }
  loading.value = false
}

onMounted(() => {
  getFoods()
})
</script>

<template>
  <main class="p-4 md:p-6">
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
        Discovered Foods
      </h1>
      <p class="text-neutral-600 dark:text-neutral-400 mt-1">{{ foods.length }} food spots found</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <USpinner size="xl" />
    </div>

    <div
      v-else-if="foods.length === 0"
      class="text-center py-12 text-neutral-500 dark:text-neutral-400"
    >
      <i class="i-lucide-search text-4xl mb-2 block" />
      <p>No food spots yet. Click "Get Foods" to load.</p>
      <UButton @click="getFoods" class="mt-4">Get Foods</UButton>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <FoodCard v-for="food in foods" :key="food.id" :food="food" />
    </div>
  </main>
</template>
