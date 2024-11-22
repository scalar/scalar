<script lang="ts" setup>
import type { ExampleRequestProps } from '@/features/ExampleRequest/ExampleRequest.vue'

import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  id,
  layout = 'modern',
  ...exampleRequestProps
} = defineProps<
  {
    id?: string
    layout?: 'modern' | 'classic'
  } & ExampleRequestProps
>()
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :id="id"
      v-bind="exampleRequestProps" />
  </template>
  <template v-else>
    <ModernLayout
      :id="id"
      v-bind="exampleRequestProps" />
  </template>
</template>
