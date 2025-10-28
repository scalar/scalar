<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { tag, layout, moreThanOneTag, isLoading } = defineProps<{
  tag: TraversedTag
  layout: 'classic' | 'modern'
  moreThanOneTag: boolean
  isLoading: boolean
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
}>()
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :layout="layout"
      :tag="tag">
      <slot />
    </ClassicLayout>
  </template>
  <template v-else>
    <ModernLayout
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :isLoading="isLoading"
      :layout="layout"
      :moreThanOneTag="moreThanOneTag"
      :tag="tag">
      <slot />
    </ModernLayout>
  </template>
</template>
