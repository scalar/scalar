<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  to: string
}>()
</script>
<template>
  <RouterLink
    class="text-center border border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded text-xl px-4 py-10"
    :to="{ name: to }">
    <h2 class="mb-4 font-bold"><slot name="title" /></h2>
    <div><slot name="description" /></div>
  </RouterLink>
</template>
