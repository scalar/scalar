<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { createHtmlFromOpenApi } from '@/create-markdown-from-openapi'

const html = ref('')

onMounted(async () => {
  const response = await fetch(
    'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  )
  const data = await response.json()

  const result = await createHtmlFromOpenApi(data)

  html.value = result
})
</script>

<template>
  <main
    class="container"
    v-html="html"></main>
</template>
