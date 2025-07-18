<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'

import { Lazy } from '@/components/Lazy'
import { useNavState } from '@/hooks/useNavState'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
}>()

const { hash } = useNavState()
</script>
<template>
  <Lazy
    id="models"
    v-if="document?.components?.schemas"
    :isLazy="Boolean(hash) && !hash.startsWith('model')">
    <ClassicLayout
      v-if="config?.layout === 'classic'"
      :schemas="document.components.schemas" />
    <ModernLayout
      v-else
      :schemas="document.components.schemas" />
  </Lazy>
</template>
