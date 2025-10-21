<script setup lang="ts">
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

import IntersectionObserver from '@/components/IntersectionObserver.vue'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { schema, isCollapsed } = defineProps<{
  id: string
  name: string
  schema: SchemaObject | undefined
  isCollapsed: boolean
  options: {
    layout: 'classic' | 'modern'
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

const emit = defineEmits<{
  (e: 'intersecting', id: string): void
  (e: 'toggleSchema', id: string, open: boolean): void
  (e: 'copyAnchorUrl', id: string): void
}>()

const emitToggleSchema = (id: string, open: boolean) => {
  console.log('emitToggleSchema', id, open)
  emit('toggleSchema', id, open)
}
</script>
<template>
  <IntersectionObserver
    v-if="schema"
    :id="id"
    class="section-wrapper"
    @intersecting="() => emit('intersecting', id)">
    <ClassicLayout
      v-if="options.layout === 'classic'"
      :id="id"
      :isCollapsed="isCollapsed"
      :name="name"
      :options="options"
      :schema="schema"
      @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
      @toggleSchema="emitToggleSchema" />
    <ModernLayout
      v-else
      :id="id"
      :isCollapsed="isCollapsed"
      :name="name"
      :options="options"
      :schema="schema"
      @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
      @intersecting="(id) => emit('intersecting', id)"
      @toggleSchema="emitToggleSchema" />
  </IntersectionObserver>
</template>
