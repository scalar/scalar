<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed } from 'vue'

import { Lazy } from '@/components/Lazy'
import { useNavState } from '@/hooks/useNavState'
import { getModels } from '@/libs/openapi'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { document } = defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
}>()

const { hash } = useNavState()

/** Returns the model schemas from the document */
const schemas = computed(() => getModels(document))
</script>
<template>
  <Lazy
    id="models"
    v-if="schemas && Object.keys(schemas).length > 0"
    :isLazy="Boolean(hash) && !hash.startsWith('model')">
    <ClassicLayout
      v-if="config?.layout === 'classic'"
      :schemas="schemas" />
    <ModernLayout
      v-else
      :schemas="schemas" />
  </Lazy>
</template>
