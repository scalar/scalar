<script setup lang="ts">
defineProps<{
  state: 'success' | 'failure' | 'pending'
}>()
</script>

<template>
  <div class="mr-2">
    <div
      class="h-2 w-2 rounded-full"
      :class="{
        'bg-green': state === 'success',
        'bg-red': state === 'failure',
        'bg-grey': state === 'pending',
      }" />
  </div>
</template>
