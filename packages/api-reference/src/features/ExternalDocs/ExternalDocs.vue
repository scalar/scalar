<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { type OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  value?: OpenAPIV3_1.ExternalDocumentationObject
}>()
</script>

<template>
  <template v-if="value">
    <a
      :href="value.url"
      target="_blank"
      rel="noopener noreferrer">
      <ScalarMarkdown
        v-if="value.description"
        :value="value.description" />
      <template v-else>
        {{ value.url }}
      </template>
    </a>
  </template>
</template>
