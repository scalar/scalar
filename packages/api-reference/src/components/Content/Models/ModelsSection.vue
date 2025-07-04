<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { Spec } from '@scalar/types/legacy'

import { Models, ModelsAccordion } from '.'

withDefaults(
  defineProps<{
    document: OpenAPIV3_1.Document
    parsedSpec: Spec
    layout?: 'modern' | 'classic'
    config?: ApiReferenceConfiguration
  }>(),
  {
    layout: 'modern',
  },
)
</script>
<template>
  <template v-if="document?.components?.schemas && !config?.hideModels">
    <ModelsAccordion
      v-if="layout === 'classic'"
      :schemas="document?.components?.schemas" />
    <Models
      v-else
      :schemas="document?.components?.schemas" />
  </template>
</template>
