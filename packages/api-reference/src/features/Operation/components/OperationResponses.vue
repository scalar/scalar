<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  OperationObject,
  ResponseObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { SectionHeaderTag } from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
import { useLocalization } from '@/features/localization'
import type { OperationProps } from '@/features/Operation/Operation.vue'

import ParameterListItem from './ParameterListItem.vue'

const { responses, selectedContentTypes = {} } = defineProps<{
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
    | 'schemaKeyboardNav'
  >
}>()

const emit = defineEmits<{
  (e: 'update:selectedContentTypes', value: Record<string, string>): void
}>()
const { translate } = useLocalization()

const resolvedResponses = computed(() =>
  Object.fromEntries(
    Object.entries(responses ?? {}).flatMap(
      ([status, response]): [string, ResponseObject][] => {
        const resolved = getResolvedRef(response)
        return resolved ? [[status, resolved]] : []
      },
    ),
  ),
)

const { level: headingLevel } = useDocumentOutline('operationSection')
</script>
<template>
  <div
    v-if="Object.keys(resolvedResponses).length"
    class="mt-6">
    <!-- The heading carries the rule; the row below brings its own 10px
         trigger padding, so a bottom margin would double the gap -->
    <SectionHeaderTag
      class="text-c-1 responses-title--tree mt-3 mb-0 block! leading-[1.45] font-medium"
      :level="headingLevel"
      rule>
      {{ translate('operation.responses') }}
    </SectionHeaderTag>
    <ul
      :aria-label="translate('operation.responses')"
      class="responses-list--tree mb-3 list-none p-0 text-sm"
      role="list">
      <ParameterListItem
        v-for="(response, status) in resolvedResponses"
        :key="status"
        :breadcrumb="breadcrumb ? [...breadcrumb, 'responses'] : undefined"
        :collapsableItems
        :document
        :eventBus
        :name="status"
        :options
        :parameter="response"
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
