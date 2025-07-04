<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'

import Models from './Models.vue'
import ModelsAccordion from './ModelsAccordion.vue'

withDefaults(
  defineProps<{
    document: OpenAPIV3_1.Document
    parsedSpec: Spec
    layout?: 'modern' | 'classic'
  }>(),
  {
    layout: 'modern',
  },
)
</script>
<template>
  <template v-if="document?.components?.schemas">
    <ModelsAccordion
      v-if="layout === 'classic'"
      :schemas="document?.components?.schemas" />
    <Models
      v-else
      :schemas="document?.components?.schemas" />
  </template>
</template>
