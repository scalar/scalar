<script lang="ts" setup>
import type { StoreContext } from '@/blocks/lib/createStore'

defineProps<{
  store: StoreContext
  location: string
}>()
</script>

<template>
  <div>
    <h1>Operation Block</h1>
    <p>location: {{ location }}</p>
    <p>store: {{ store }}</p>
  </div>
</template>
