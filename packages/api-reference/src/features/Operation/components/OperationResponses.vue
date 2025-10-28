<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import ParameterListItem from './ParameterListItem.vue'

const { responses } = defineProps<{
  responses: OperationObject['responses']
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  options: {
    collapsableItems?: boolean | undefined
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()
</script>
<template>
  <div
    v-if="Object.keys(responses ?? {}).length"
    class="mt-6">
    <div class="text-c-1 mt-3 mb-3 leading-[1.45] font-medium">Responses</div>
    <ul class="mb-3 list-none p-0 text-sm">
      <ParameterListItem
        v-for="(response, status) in responses"
        :key="status"
        :breadcrumb="breadcrumb"
        :eventBus="eventBus"
        :name="status"
        :options="options"
        :parameter="getResolvedRef(response)" />
    </ul>
  </div>
</template>
