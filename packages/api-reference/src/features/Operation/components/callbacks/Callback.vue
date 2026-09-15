<script setup lang="ts">
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  type OpenApiDocument,
  type OperationObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed, useId } from 'vue'

import {
  toNodeKey,
  useSchemaExpansion,
} from '@/components/Content/Schema/helpers/schema-expansion'
import SchemaGlyphPuck from '@/components/Content/Schema/SchemaGlyphPuck.vue'
import { HttpMethod } from '@/components/HttpMethod'
import OperationParameters from '@/features/Operation/components/OperationParameters.vue'
import OperationResponses from '@/features/Operation/components/OperationResponses.vue'
import type { OperationProps } from '@/features/Operation/Operation.vue'

const { method, name, url, options, document, breadcrumb } = defineProps<{
  callback: OperationObject
  method: HttpMethodType
  name: string
  url: string
  eventBus: WorkspaceEventBus | null
  /** The document the callback belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  /** Breadcrumb of this callback, making its body and responses addressable */
  breadcrumb?: string[]
  options: Pick<
    OperationProps['options'],
    | 'hideModels'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
    | 'schemaKeyboardNav'
  >
}>()

/**
 * A controlled disclosure keyed to the breadcrumb, so deep links can open the
 * callback and its state survives remounts like any other node.
 */
const expansion = useSchemaExpansion()
const anonymousKey = useId()
const nodeKey = computed(
  (): string => toNodeKey(breadcrumb) || `~anonymous-${anonymousKey}`,
)
const panelId = useId()

const isOpen = computed((): boolean => expansion.isExpanded(nodeKey.value, {}))

const toggle = (): void => {
  expansion.setExpanded(nodeKey.value, !isOpen.value)
}
</script>

<template>
  <!-- A callback is one more row of the responses grammar — the whole row is
       the disclosure button and the open body is a railed panel. No card
       chrome, no sticky, no wrapping. -->
  <div class="callback-list-item callback-list-item--tree">
    <button
      :aria-controls="isOpen ? panelId : undefined"
      :aria-expanded="isOpen"
      class="callback-item-trigger group/tree-control font-code flex w-full cursor-pointer items-baseline gap-1.5 border-none bg-transparent p-0 py-2.5 text-start text-sm leading-(--scalar-line-height-5)"
      type="button"
      @click="toggle">
      <!-- The positioned ancestor is this inline wrapper, so the line anchor
           centres the puck on the title's first line, not the padded button. -->
      <span
        class="callback-item-name relative flex min-w-0 flex-1 items-baseline gap-1.5">
        <SchemaGlyphPuck
          anchor="line"
          class="callback-item-glyph"
          :open="isOpen" />
        <HttpMethod
          as="span"
          class="request-method font-bold"
          :method="method" />
        <span class="text-c-1 min-w-0 flex-1 truncate font-bold">
          {{ name }}
          <span class="text-c-2 font-normal">
            {{ url }}
          </span>
        </span>
      </span>
    </button>

    <!-- No rail, and no indent. What opens here is the operation's own set of
         page-level sections (Parameters, Body, Responses), which is the same
         level the operation itself renders them at, and that level never draws
         a rail — the tree only starts one on the level below. The schema rows
         inside each section still rail their own children, and their pucks
         hang in the margin exactly as they do at the top of an operation.
         The 24px gap paces the sections at the page's own rhythm, so their
         page-layout top margins (the section roots, the heading `mt-3`s) are
         zeroed from here; they would double up in this context. The sections
         are page-level headings, so in here their titles and the body
         description step down to the callback row's own 13px; at that size
         the titles take the property names' weight so they still read as
         headings. -->
    <div
      v-if="isOpen"
      :id="panelId"
      class="callback-operation-panel mt-1.5 mb-0.5 flex flex-col gap-6 [&_.parameter-list-title--tree]:mt-0! [&_.parameter-list-title--tree]:text-(length:--scalar-font-size-4)! [&_.parameter-list-title--tree]:font-(--scalar-bold)! [&_.request-body]:mt-0! [&_.request-body-description]:mt-0! [&_.request-body-description]:text-(length:--scalar-font-size-4)! [&_.request-body-header]:mt-0! [&_.request-body-title]:text-(length:--scalar-font-size-4)! [&_.request-body-title]:font-(--scalar-bold)! [&_.responses-title--tree]:mt-0! [&_.responses-title--tree]:text-(length:--scalar-font-size-4)! [&_.responses-title--tree]:font-(--scalar-bold)! [&>*]:mt-0!">
      <OperationParameters
        :breadcrumb="breadcrumb"
        :document="document"
        :eventBus="eventBus"
        :options="options"
        :parameters="callback.parameters ?? []"
        :requestBody="getResolvedRef(callback.requestBody)" />

      <OperationResponses
        :breadcrumb="breadcrumb"
        :collapsableItems="false"
        :document
        :eventBus
        :options
        :responses="callback.responses" />
    </div>
  </div>
</template>
