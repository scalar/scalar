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
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :layout="layout"
      :nested="nested"
      :tag="tag">
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
      <slot />
    </ModernLayout>
  </template>
</template>
