<script lang="ts" setup>
/* eslint-disable vue/valid-template-root */
import { onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'input', input: string, title?: string | null): void
}>()

// Check query parameters
onMounted(() => {
  const queryParameters = new URLSearchParams(window.location.search)
  const urlQueryParameter = queryParameters.get('url')
  const titleQueryParameter = queryParameters.get('title')

  if (urlQueryParameter) {
    emit('input', urlQueryParameter, titleQueryParameter)
  }
})
</script>

<template></template>
