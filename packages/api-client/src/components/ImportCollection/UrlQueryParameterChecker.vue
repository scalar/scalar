<script lang="ts" setup>
/* eslint-disable vue/valid-template-root */
import { onMounted } from 'vue'

const emit = defineEmits<{
  (
    e: 'input',
    url: string,
    integration: string | null,
    eventType: 'query',
  ): void
}>()

// Check URL query parameters for 'url' and 'integration' values
onMounted(() => {
  const queryParameters = new URLSearchParams(window.location.search)

  const urlQueryParameter = queryParameters.get('url')

  if (urlQueryParameter) {
    emit(
      'input',
      urlQueryParameter,
      queryParameters.get('integration'),
      'query',
    )
  }
})
</script>

<template></template>
