<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Lazy } from '@/components/Lazy'
import { useNavState } from '@/hooks/useNavState'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { document } = defineProps<{
  document: OpenApiDocument | undefined
  config: ApiReferenceConfiguration
}>()

const { hash } = useNavState()

/** Array of the name and value of all component schemas */
const schemas = computed(() => {
  const _schemas = document?.components?.schemas

  if (!_schemas) {
    return []
  }

  const entries = Object.entries(_schemas)

  /** Remove any internal or ignored schemas */
  return entries.flatMap(([name, schema]) => {
    if (schema['x-internal'] || schema['x-scalar-ignore']) {
      return []
    }

    // Need the type assertion because of the typescript limitation
    return [{ name, schema: schema }]
  })
})
</script>
<template>
  <Lazy
    id="models"
    v-if="schemas && Object.keys(schemas).length > 0"
    :isLazy="Boolean(hash) && !hash.startsWith('model')">
    <ClassicLayout
      v-if="config?.layout === 'classic'"
      :models="schemas" />
    <ModernLayout
      v-else
      :schemas="schemas" />
  </Lazy>
</template>
