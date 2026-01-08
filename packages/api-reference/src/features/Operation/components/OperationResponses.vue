<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { OperationProps } from '@/features/Operation/Operation.vue'

import ParameterListItem from './ParameterListItem.vue'

const { responses } = defineProps<{
  responses: OperationObject['responses']
  breadcrumb?: string[]
  collapsableItems?: boolean
  eventBus: WorkspaceEventBus | null
  options: Pick<
    OperationProps['options'],
    'orderRequiredPropertiesFirst' | 'orderSchemaPropertiesBy'
  >
}>()
</script>
<template>
  <div
    v-if="Object.keys(responses ?? {}).length"
    class="mt-6">
    <div class="text-c-1 mt-3 mb-3 leading-[1.45] font-medium">Responses</div>
    <ul
      aria-label="Responses"
      class="mb-3 list-none p-0 text-sm">
      <ParameterListItem
        v-for="(response, status) in responses"
        :key="status"
        :breadcrumb
        :collapsableItems
        :eventBus
        :name="status"
        :options
        :parameter="getResolvedRef(response)" />
    </ul>
  </div>
</template>
