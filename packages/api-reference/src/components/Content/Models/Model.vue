<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, useTemplateRef } from 'vue'

import { useIntersection } from '@/hooks/use-intersection'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { config, schema, isCollapsed, id, eventBus } = defineProps<{
  id: string
  name: string
  config: ApiReferenceConfiguration
  schema: SchemaObject | undefined
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
}>()

const section = useTemplateRef<HTMLElement>('section')

useIntersection(section, () => eventBus?.emit('intersecting:nav-item', { id }))

/** Cache the schema options in a computed */
const schemaOptions = computed(() => ({
  orderRequiredPropertiesFirst: config.orderRequiredPropertiesFirst,
  orderSchemaPropertiesBy: config.orderSchemaPropertiesBy,
}))
</script>
<template>
  <div
    v-if="schema"
    ref="section">
    <ClassicLayout
      v-if="config.layout === 'classic'"
      :id="id"
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :name="name"
      :options="schemaOptions"
      :schema="schema" />
    <ModernLayout
      v-else
      :id="id"
      :eventBus
      :isCollapsed="isCollapsed"
      :name="name"
      :options="schemaOptions"
      :schema="schema" />
  </div>
</template>
