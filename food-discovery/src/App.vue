<script setup lang="ts">
import Header from './components/Header.vue'
</script>

<template>
  <main id="app-wrapper">
    <Header id="header-wrapper" />
    <RouterView id="router-wrapper" />
  </main>
</template>

<style scoped>
#router-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  font-weight: normal;
  display: block;
}
</style>
