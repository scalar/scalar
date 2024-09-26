<script lang="ts" setup>
/* eslint-disable vue/valid-template-root */
import { onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'input', input: string): void
}>()

// Check query parameters
onMounted(() => {
  const queryParameters = new URLSearchParams(window.location.search)
  const urlQueryParameter = queryParameters.get('url')

  if (urlQueryParameter) {
    emit('input', urlQueryParameter)
  }
})
</script>

<template></template>
