<script setup lang="ts">
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { tag, layout, moreThanOneTag, isLoading } = defineProps<{
  tag: TraversedTag
  layout: 'classic' | 'modern'
  moreThanOneTag: boolean
  isLoading: boolean
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleTag', id: string, open: boolean): void
  (e: 'scrollToId', id: string): void
  (e: 'copyAnchorUrl', id: string): void
  (e: 'intersecting', id: string): void
}>()
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :isCollapsed="isCollapsed"
      :layout="layout"
      :tag="tag"
      @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
      @toggleTag="(id, open) => emit('toggleTag', id, open)">
      <slot />
    </ClassicLayout>
  </template>
  <template v-else>
    <ModernLayout
      :isCollapsed="isCollapsed"
      :isLoading="isLoading"
      :layout="layout"
      :moreThanOneTag="moreThanOneTag"
      :tag="tag"
      @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
      @intersecting="(id) => emit('intersecting', id)"
      @scrollToId="(id) => emit('scrollToId', id)"
      @toggleTag="(id, open) => emit('toggleTag', id, open)">
      <slot />
    </ModernLayout>
  </template>
</template>
