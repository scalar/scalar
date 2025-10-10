<script setup lang="ts">
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { tag, layout, moreThanOneTag, isLoading, onShowMore } = defineProps<{
  tag: TraversedTag
  layout: 'classic' | 'modern'
  moreThanOneTag: boolean
  isLoading: boolean
  onShowMore: ((id: string) => void) | undefined
}>()
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout :tag="tag">
      <slot />
    </ClassicLayout>
  </template>
  <template v-else>
    <ModernLayout
      :isLoading="isLoading"
      :moreThanOneTag="moreThanOneTag"
      :onShowMore="onShowMore"
      :tag="tag">
      <slot />
    </ModernLayout>
  </template>
</template>
