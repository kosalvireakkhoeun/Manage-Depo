<script setup>
import { ref } from 'vue'
import { supabase } from '../utils/supabase'

const food = ref([])

async function getFoods() {
  const { data, error } = await supabase.from('food_spots').select()
  if (!error && data != null) {
    food.value = data
  }
}
</script>

<template>
  <main>
    <div>
      {{ food }}
    </div>
    <UButton @click="getFoods">Get Foods</UButton>
  </main>
</template>
