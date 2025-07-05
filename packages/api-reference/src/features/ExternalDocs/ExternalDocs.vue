<script setup lang="ts">
import { type OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  value?: OpenAPIV3_1.ExternalDocumentationObject
}>()
</script>

<template>
  <template v-if="value">
    <a
      :href="value.url"
      target="_blank">
      {{ value.description || value.url }}
    </a>
  </template>
</template>
