<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '../utils/supabase'

const todos = ref([])

async function getTodos() {
  const { data, error } = await supabase.from('food_spots').select()
  console.log(data, error)
  if (!error && data != null) {
    todos.value = data
  }
}
</script>

<template>
  <main>
    <div>
      {{ todos }}
    </div>
    <UButton @click="getTodos">Get Todos</UButton>
  </main>
</template>
