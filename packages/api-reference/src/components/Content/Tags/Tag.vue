<script setup lang="ts">
import type { TraversedTag } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

defineProps<{
  tag: TraversedTag
  layout: 'classic' | 'modern'
  moreThanOneTag: boolean
}>()
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout v-bind="$props">
      <slot />
    </ClassicLayout>
  </template>
  <template v-else>
    <ModernLayout v-bind="$props">
      <slot />
    </ModernLayout>
  </template>
</template>
