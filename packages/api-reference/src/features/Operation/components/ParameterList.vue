<script setup lang="ts">
import { shouldIgnoreEntity } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, useId } from 'vue'

import ParameterListItem from './ParameterListItem.vue'

const { parameters } = defineProps<{
  parameters: ParameterObject[]
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  options: {
    collapsableItems?: boolean
    withExamples?: boolean
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

/** Accessible id for the heading */
const id = useId()

/** Filter out ignored and internal parameters */
const filteredParameters = computed(() =>
  parameters.filter((parameter) => !shouldIgnoreEntity(parameter)),
)
</script>
<template>
  <div
    v-if="filteredParameters?.length"
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
        v-for="item in filteredParameters"
        :key="item.name"
        :breadcrumb="breadcrumb"
        :eventBus="eventBus"
        :name="item.name"
        :options="options"
        :parameter="item" />
    </ul>
  </div>
</template>
