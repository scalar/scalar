<script setup lang="ts">
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import ParameterListItem from './ParameterListItem.vue'

defineProps<{
  parameters: ParameterObject[]
  breadcrumb?: string[]
  options: {
    collapsableItems?: boolean
    withExamples?: boolean
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()
</script>
<template>
  <div
    v-if="parameters?.length"
    class="mt-6">
    <div class="text-c-1 mt-3 mb-3 text-lg leading-[1.45] font-medium">
      <slot name="title" />
    </div>
    <ul class="mb-3 list-none p-0 text-sm">
      <ParameterListItem
        v-for="item in parameters"
        :key="item.name"
        :breadcrumb="breadcrumb"
        :name="item.name"
        :options="options"
        :parameter="item" />
    </ul>
  </div>
</template>
