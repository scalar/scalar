<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed } from 'vue'

import { getModels } from '@/libs/openapi'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { document } = defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
}>()

/** Returns the model schemas from the document */
const schemas = computed(() => getModels(document))
</script>
<template>
  <ClassicLayout
    v-if="config?.layout === 'classic'"
    :schemas="schemas" />
  <ModernLayout
    v-else
    :config="config"
    :schemas="schemas" />
</template>
