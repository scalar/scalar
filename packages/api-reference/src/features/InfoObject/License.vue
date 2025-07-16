<script setup lang="ts">
import { type OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  value?: OpenAPIV3_1.LicenseObject
}>()
</script>

<template>
  <a
    v-if="value?.url"
    :href="value.url"
    target="_blank"
    rel="noopener noreferrer">
    {{ value?.name || value.url }}
  </a>
  <template v-else>
    <span>{{ value?.name }}</span>
  </template>
</template>
