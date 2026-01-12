<script setup lang="ts">
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { useTemplateRef } from 'vue'

import { useIntersection } from '@/hooks/use-intersection'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { schema, isCollapsed, id, options, eventBus } = defineProps<{
  id: string
  name: string
  options: Pick<
    ApiReferenceConfigurationRaw,
    'layout' | 'orderRequiredPropertiesFirst' | 'orderSchemaPropertiesBy'
  >
  schema: SchemaObject | undefined
  isCollapsed: boolean
  eventBus: WorkspaceEventBus
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
      :eventBus
      :isCollapsed
      :name
      :options
      :schema />
    <ModernLayout
      v-else
      :id
      :eventBus
      :isCollapsed
      :name
      :options
      :schema />
  </div>
</template>
