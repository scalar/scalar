<script setup lang="ts">
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isMultiFormatSchemaObject } from '@scalar/workspace-store/helpers/type-guards'
import type { ComponentsObject as AsyncApiComponentsObject } from '@scalar/workspace-store/schemas/asyncapi/v3.0/components'
import type { TraversedDescription } from '@scalar/workspace-store/schemas/navigation'
import type {
  ComponentsObject as OpenApiComponentsObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Lazy } from '@/components/Lazy'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { schemas = {}, models } = defineProps<{
  schemas:
    | OpenApiComponentsObject['schemas']
    | AsyncApiComponentsObject['schemas']
  models: TraversedDescription | undefined
  hash: string
  options: {
    layout: 'classic' | 'modern'
    expandAllModelSections: boolean | undefined
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
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
      // TODO: Add support for multi-format schemas, remove type-casting and v-if
      schema: getResolvedRef(schemas[it.name]) as SchemaObject,
    }))
})
</script>
<template>
  <Lazy
    v-if="
      schemas &&
      Object.keys(schemas).length > 0 &&
      !isMultiFormatSchemaObject(schemas)
    "
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
