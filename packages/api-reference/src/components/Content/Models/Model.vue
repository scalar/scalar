<script setup lang="ts">
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  OpenApiDocument,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { useTemplateRef } from 'vue'

import { useIntersection } from '@/hooks/use-intersection'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { schema, isCollapsed, id, options, eventBus, document } = defineProps<{
  id: string
  name: string
  options: Pick<
    ApiReferenceConfigurationRaw,
    | 'layout'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'hideModels'
  >
  schema: SchemaObject | undefined
  isCollapsed: boolean
  eventBus: WorkspaceEventBus
  /** The document the model belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
}>()

const section = useTemplateRef<HTMLElement>('section')

useIntersection(section, () => eventBus?.emit('intersecting:nav-item', { id }))
</script>
<template>
  <div
    v-if="schema"
    ref="section">
    <ClassicLayout
      v-if="options.layout === 'classic'"
      :id
      :document
      :eventBus
      :isCollapsed
      :name
      :options
      :schema />
    <ModernLayout
      v-else
      :id
      :document
      :eventBus
      :isCollapsed
      :name
      :options
      :schema />
  </div>
</template>
