<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  OperationObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { useSchemaLayout } from '@/components/Content/Schema/helpers/use-schema-layout'
import { SectionHeaderTag } from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
import { useLocalization } from '@/features/localization'
import type { OperationProps } from '@/features/Operation/Operation.vue'

import ParameterListItem from './ParameterListItem.vue'

const {
  responses,
  options,
  selectedContentTypes = {},
} = defineProps<{
  responses: OperationObject['responses']
  breadcrumb?: string[]
  collapsableItems?: boolean
  eventBus: WorkspaceEventBus | null
  /** The document the operation belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  /**
   * Selected response content type per status code, shared with the example response panel
   * so the two stay in sync. Keyed by status code (e.g. "200"), valued by MIME type.
   */
  selectedContentTypes?: Record<string, string>
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

const emit = defineEmits<{
  (e: 'update:selectedContentTypes', value: Record<string, string>): void
}>()
const { translate } = useLocalization()

const { level: headingLevel } = useDocumentOutline('operationSection')

const { isTreeLayout } = useSchemaLayout(() => options.schemaLayout)
</script>
<template>
  <div
    v-if="Object.keys(responses ?? {}).length"
    class="mt-6">
    <!-- Tree: the heading carries the rule; the row below brings its own 10px
         trigger padding, so a bottom margin would double the gap -->
    <SectionHeaderTag
      class="text-c-1 mt-3 block! leading-[1.45] font-medium"
      :class="isTreeLayout ? 'responses-title--tree mb-0' : 'mb-3'"
      :level="headingLevel"
      :rule="isTreeLayout">
      {{ translate('operation.responses') }}
    </SectionHeaderTag>
    <ul
      :aria-label="translate('operation.responses')"
      class="mb-3 list-none p-0 text-sm"
      :class="{ 'responses-list--tree': isTreeLayout }"
      role="list">
      <ParameterListItem
        v-for="(response, status) in responses"
        :key="status"
        :breadcrumb="breadcrumb ? [...breadcrumb, 'responses'] : undefined"
        :collapsableItems
        :document
        :eventBus
        :name="status"
        :options
        :parameter="getResolvedRef(response)"
        @update:selectedContentType="
          (type) =>
            emit('update:selectedContentTypes', {
              ...selectedContentTypes,
              [status]: type,
            })
        " />
    </ul>
  </div>
</template>
