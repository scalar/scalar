<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { tag, layout, moreThanOneTag } = defineProps<{
  tag: TraversedTag
  layout: 'classic' | 'modern'
  moreThanOneTag: boolean
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  /** Whether this tag sits inside a parent tag's container (drops its own padding). */
  nested?: boolean
}>()
defineSlots<{
  /** Tag operations and nested content. */
  default?: () => unknown
  /** Optional header actions for embedded tag pages. */
  actions?: () => unknown
}>()
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :layout="layout"
      :nested="nested"
      :tag="tag">
      <template
        v-if="$slots.actions"
        #actions>
        <slot name="actions" />
      </template>
      <slot />
    </ClassicLayout>
  </template>
  <template v-else>
    <ModernLayout
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :layout="layout"
      :moreThanOneTag="moreThanOneTag"
      :nested="nested"
      :tag="tag">
      <template
        v-if="$slots.actions"
        #actions>
        <slot name="actions" />
      </template>
      <slot />
    </ModernLayout>
  </template>
</template>
