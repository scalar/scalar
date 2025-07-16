<script setup lang="ts">
import { type OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  value?: OpenAPIV3_1.InfoObject['termsOfService']
}>()
</script>

<template>
  <template v-if="value">
    <a
      :href="value"
      target="_blank"
      rel="noopener noreferrer">
      Terms of Service
    </a>
  </template>
</template>
