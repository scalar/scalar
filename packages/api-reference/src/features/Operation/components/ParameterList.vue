<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { useId } from 'vue'

import type { OperationProps } from '@/features/Operation/Operation.vue'

import ParameterListItem from './ParameterListItem.vue'

const { parameters } = defineProps<{
  parameters: ParameterObject[]
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  collapsableItems?: boolean
  options: Pick<
    OperationProps['options'],
    'orderRequiredPropertiesFirst' | 'orderSchemaPropertiesBy'
  >
}>()

/** Accessible id for the heading */
const id = useId()
</script>
<template>
  <div
    v-if="parameters?.length"
    class="mt-6">
    <div
      :id
      class="text-c-1 mt-3 mb-3 text-lg leading-[1.45] font-medium">
      <slot name="title" />
    </div>
    <ul
      :aria-labelledby="id"
      class="mb-3 list-none p-0 text-sm">
      <ParameterListItem
        v-for="item in parameters"
        :key="item.name"
        :breadcrumb="breadcrumb"
        :collapsableItems
        :eventBus="eventBus"
        :name="item.name"
        :options="options"
        :parameter="item" />
    </ul>
  </div>
</template>
