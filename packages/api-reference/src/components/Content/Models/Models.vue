<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Lazy } from '@/components/Lazy'
import { useNavState } from '@/hooks/useNavState'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { document } = defineProps<{
  document: OpenApiDocument
  config: ApiReferenceConfiguration
}>()

const { hash } = useNavState()

/** Array of the name and value of all component schemas */
const schemas = computed(() => {
  const _schemas = document.components?.schemas

  if (!_schemas) {
    return []
  }

  const entries = Object.entries(_schemas)

  /** Remove any internal or ignored schemas */
  return entries.flatMap(([name, _schema]) => {
    const schema = getResolvedRef(_schema)
    if (schema['x-internal'] || schema['x-scalar-ignore']) {
      return []
    }

    // Need the type assertion because of the typescript limitation
    return [{ name, schema }]
  })
})
</script>
<template>
  <Lazy
    v-if="schemas && Object.keys(schemas).length > 0"
    id="models"
    :isLazy="Boolean(hash) && !hash.startsWith('model')">
    <ClassicLayout
      v-if="config?.layout === 'classic'"
      :models="schemas" />
    <ModernLayout
      v-else
      :config="config"
      :schemas="schemas" />
  </Lazy>
</template>
