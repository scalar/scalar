<script lang="ts" setup>
import type { TransformedOperation } from '@scalar/types/legacy'

import ClassicLayout from '../layouts/ClassicLayout.vue'
import ModernLayout from '../layouts/ModernLayout.vue'

withDefaults(
  defineProps<{
    id?: string
    operation: TransformedOperation
    layout?: 'modern' | 'classic'
  }>(),
  {
    layout: 'modern',
  },
)
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :id="id"
      :operation="operation" />
  </template>
  <template v-else>
    <ModernLayout
      :id="id"
      :operation="operation" />
  </template>
</template>
