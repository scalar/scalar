<script setup lang="ts">
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedDescription } from '@scalar/workspace-store/schemas/navigation'
import type { ComponentsObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Lazy } from '@/components/Lazy'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { schemas = {}, models } = defineProps<{
  schemas: ComponentsObject['schemas']
  models: TraversedDescription | undefined
  hash: string
  options: {
    layout: 'classic' | 'modern'
    expandAllModelSections: boolean | undefined
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
    onShowMore: ((id: string) => void) | undefined
  }
}>()

/** Array of the name and value of all component schemas */
const flatSchemas = computed(() => {
  const schemaEntries = models?.children ?? []

  return schemaEntries
    .filter((it) => it.type === 'model')
    .map((it) => ({
      id: it.id,
      name: it.name,
      schema: getResolvedRef(schemas[it.name]),
    }))
})
</script>
<template>
  <Lazy
    v-if="schemas && Object.keys(schemas).length > 0"
    id="models"
    :isLazy="Boolean(hash) && !hash.startsWith('model')">
    <ClassicLayout
      v-if="options?.layout === 'classic'"
      :options="options"
      :schemas="flatSchemas" />
    <ModernLayout
      v-else
      :options="options"
      :schemas="flatSchemas" />
  </Lazy>
</template>
