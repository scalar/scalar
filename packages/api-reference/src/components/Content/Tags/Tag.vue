<script setup lang="ts">
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { tag, layout, moreThanOneTag, isLoading, onShowMore } = defineProps<{
  tag: TraversedTag
  layout: 'classic' | 'modern'
  moreThanOneTag: boolean
  isLoading: boolean
}>()
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :layout="layout"
      :tag="tag">
      <slot />
    </ClassicLayout>
  </template>
  <template v-else>
    <ModernLayout
      :isLoading="isLoading"
      :layout="layout"
      :moreThanOneTag="moreThanOneTag"
      :onShowMore="onShowMore"
      :tag="tag">
      <slot />
    </ModernLayout>
  </template>
</template>
