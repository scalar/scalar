<script setup lang="ts">
import {
  type OpenAPIV2,
  type OpenAPIV3,
  type OpenAPIV3_1,
} from '@scalar/openapi-types'

defineProps<{
  value?:
    | OpenAPIV2.ExternalDocumentationObject
    | OpenAPIV3.ExternalDocumentationObject
    | OpenAPIV3_1.ExternalDocumentationObject
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
