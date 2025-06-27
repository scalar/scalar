<script setup lang="ts">
/**
 * TODO: This works, but doesn't render anything on the server. Sooo we have some work ahead of us.
 */
import { onMounted, ref } from 'vue'

import { createApiReference } from '../../../src/standalone/lib/html-api'

const containerRef = ref<HTMLDivElement>()

onMounted(() => {
  if (!containerRef.value) {
    return
  }

  createApiReference(containerRef.value, {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  })
})
</script>

<template>
  <div ref="containerRef"></div>
</template>
