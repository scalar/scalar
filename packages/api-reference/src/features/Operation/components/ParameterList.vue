<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  OpenApiDocument,
  ParameterObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { useId } from 'vue'

import { useSchemaLayout } from '@/components/Content/Schema/helpers/use-schema-layout'
import { SectionHeaderTag } from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
import type { OperationProps } from '@/features/Operation/Operation.vue'

import ParameterListItem from './ParameterListItem.vue'

const { parameters, options } = defineProps<{
  parameters: ParameterObject[]
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  collapsableItems?: boolean
  /** The document the operation belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  options: Pick<
    OperationProps['options'],
    | 'hideModels'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
    | 'schemaLayout'
    | 'schemaKeyboardNav'
  >
}>()

/** Accessible id for the heading */
const id = useId()

const { level: headingLevel } = useDocumentOutline('operationSection')

const { isTreeLayout } = useSchemaLayout(() => options.schemaLayout)
</script>
<template>
  <div
    v-if="parameters?.length"
    class="mt-6">
    <!-- Tree: the heading carries the rule. A static row pads only 6px, so a
         6px bottom margin lands the same 12px gap the responses heading gets
         from its row's 10px trigger padding -->
    <SectionHeaderTag
      :id
      class="text-c-1 mt-3 block! text-lg leading-[1.45] font-medium"
      :class="isTreeLayout ? 'parameter-list-title--tree mb-1.5' : 'mb-3'"
      :level="headingLevel"
      :rule="isTreeLayout">
      <slot name="title" />
    </SectionHeaderTag>
    <ul
      :aria-labelledby="id"
      class="mb-3 list-none p-0 text-sm"
      role="list">
      <ParameterListItem
        v-for="item in parameters"
        :key="item.name"
        :breadcrumb="breadcrumb"
        :collapsableItems
        :document="document"
        :eventBus="eventBus"
        :name="item.name"
        :options="options"
        :parameter="item" />
    </ul>
  </div>
</template>
