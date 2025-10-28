<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { useTemplateRef } from 'vue'

import { useIntersection } from '@/hooks/use-intersection'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { schema, isCollapsed, id, eventBus } = defineProps<{
  id: string
  name: string
  schema: SchemaObject | undefined
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  options: {
    layout: 'classic' | 'modern'
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
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
      :id="id"
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :name="name"
      :options="options"
      :schema="schema" />
    <ModernLayout
      v-else
      :id="id"
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :name="name"
      :options="options"
      :schema="schema" />
  </div>
</template>
