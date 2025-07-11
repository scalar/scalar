<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
}>()
</script>
<template>
  <template v-if="document?.components?.schemas">
    <ClassicLayout
      v-if="config?.layout === 'classic'"
      :schemas="document.components.schemas" />
    <ModernLayout
      v-else
      :schemas="document.components.schemas" />
  </template>
</template>
