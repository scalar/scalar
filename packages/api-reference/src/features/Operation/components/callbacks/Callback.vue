<script setup lang="ts">
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconCaretRight } from '@scalar/icons'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  type OpenApiDocument,
  type OperationObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, useId } from 'vue'

import {
  toNodeKey,
  useSchemaExpansion,
} from '@/components/Content/Schema/helpers/schema-expansion'
import { useSchemaLayout } from '@/components/Content/Schema/helpers/use-schema-layout'
import SchemaGlyphPuck from '@/components/Content/Schema/SchemaGlyphPuck.vue'
import SchemaRailPanel from '@/components/Content/Schema/SchemaRailPanel.vue'
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
    | 'schemaLayout'
    | 'schemaKeyboardNav'
  >
}>()

const { isTreeLayout } = useSchemaLayout(() => options.schemaLayout)

/**
 * Tree layout: a controlled disclosure keyed to the breadcrumb, so deep links
 * can open the callback and its state survives remounts like any other node.
 */
const expansion = useSchemaExpansion()
const anonymousKey = useId()
const nodeKey = computed(
  (): string => toNodeKey(breadcrumb) || `~anonymous-${anonymousKey}`,
)
const panelId = useId()

const isOpen = computed(
  (): boolean => isTreeLayout.value && expansion.isExpanded(nodeKey.value, {}),
)

const toggle = (): void => {
  expansion.setExpanded(nodeKey.value, !isOpen.value)
}
</script>

<template>
  <!-- Tree layout: a callback is one more row of the responses grammar — the
       whole row is the disclosure button and the open body is a railed panel.
       No card chrome, no sticky, no wrapping. -->
  <div
    v-if="isTreeLayout"
    class="callback-list-item callback-list-item--tree">
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

    <!-- Depth 1: the same depth an opened response panel declares, so pucks
         inside land on this rail. Clicking the rail closes the callback. The
         panel's 24px gap paces the sections at the page's own rhythm, so their
         page-layout top margins (the section roots, the heading `mt-3`s) are
         zeroed from here; they would double up inside the rail. The sections
         (Parameters, Body, Responses) are page-level headings, so in here
         their titles and the body description step down to the callback
         row's own 13px, as legacy does; at that size the titles take the
         property names' weight so they still read as headings. -->
    <SchemaRailPanel
      v-if="isOpen"
      :id="panelId"
      class="callback-operation-panel mt-1.5 mb-0.5 flex flex-col gap-6 [&_.parameter-list-title--tree]:mt-0! [&_.parameter-list-title--tree]:text-(length:--scalar-font-size-4)! [&_.parameter-list-title--tree]:font-(--scalar-bold)! [&_.request-body]:mt-0! [&_.request-body-description]:mt-0! [&_.request-body-description]:text-(length:--scalar-font-size-4)! [&_.request-body-header]:mt-0! [&_.request-body-title]:text-(length:--scalar-font-size-4)! [&_.request-body-title]:font-(--scalar-bold)! [&_.responses-title--tree]:mt-0! [&_.responses-title--tree]:text-(length:--scalar-font-size-4)! [&_.responses-title--tree]:font-(--scalar-bold)! [&>*]:mt-0!"
      closeOnRail
      :depth="1"
      @close="expansion.setExpanded(nodeKey, false)">
      <OperationParameters
        :breadcrumb="breadcrumb"
        :document="document"
        :eventBus="eventBus"
        :options="options"
        :parameters="
          callback.parameters?.map((param) => getResolvedRef(param)) ?? []
        "
        :requestBody="getResolvedRef(callback.requestBody)" />

      <OperationResponses
        :breadcrumb="breadcrumb"
        :collapsableItems="false"
        :document
        :eventBus
        :options
        :responses="callback.responses" />
    </SchemaRailPanel>
  </div>

  <!-- Legacy: the native details/summary, untouched -->
  <details
    v-else
    class="group callback-list-item">
    <!-- Title -->
    <summary
      class="font-code bg-b-1 callback-sticky-offset callback-list-item-title sticky flex cursor-pointer flex-row items-start gap-2 border-t py-2.5 text-sm group-open:flex-wrap">
      <ScalarIconCaretRight
        class="callback-list-item-icon text-c-3 group-hover:text-c-1 absolute top-3.5 -left-5 size-3 transition-transform duration-100 group-open:rotate-90"
        weight="bold" />
      <HttpMethod
        as="span"
        class="request-method py-0.75 font-bold"
        :method="method" />
      <div
        class="text-c-1 min-w-0 flex-1 truncate text-sm leading-5 font-bold group-open:whitespace-normal">
        {{ name }}
        <span class="text-c-2 font-normal">
          {{ url }}
        </span>
      </div>
    </summary>

    <!-- Body -->
    <div class="callback-operation-container flex flex-col gap-2">
      <OperationParameters
        :breadcrumb="breadcrumb"
        :document="document"
        :eventBus="eventBus"
        :options="options"
        :parameters="
          callback.parameters?.map((param) => getResolvedRef(param)) ?? []
        "
        :requestBody="getResolvedRef(callback.requestBody)" />

      <!-- Responses -->
      <OperationResponses
        :breadcrumb="breadcrumb"
        :collapsableItems="false"
        :document
        :eventBus
        :options
        :responses="callback.responses" />
    </div>
  </details>
</template>
<style scoped>
.callback-sticky-offset {
  top: var(--refs-viewport-offset, 0px);
  z-index: 1;
}
.callback-operation-container :deep(.request-body),
.callback-operation-container :deep(.request-body-description),
.callback-operation-container :deep(.request-body-header) {
  margin-top: 0;
}
.callback-operation-container :deep(.request-body-header) {
  --scalar-font-size-2: var(--scalar-font-size-4);
  padding: 10px;
  border-bottom: none;
  border: 0.5px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg) var(--scalar-radius-lg) 0 0;
  background: color-mix(in srgb, var(--scalar-background-2) 50%, transparent);
}
.callback-operation-container
  :deep(.request-body-schema > .schema-card > .schema-card-description) {
  padding-inline: 8px;
}
/* Legacy rule; the tree only excludes itself here. */
.callback-operation-container
  :deep(ul li.property.property--level-1:not(.property--tree)) {
  padding: 10px;
}
.callback-operation-container :deep(.request-body-schema) {
  background-color: var(--scalar-background-1);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-top: none;
  overflow: hidden;
  border-radius: 0 0 var(--scalar-radius-lg) var(--scalar-radius-lg);
}
.callback-operation-container :deep(.parameter-list) {
  margin-top: 0;
}
.callback-operation-container :deep(.parameter-list-title) {
  background: color-mix(in srgb, var(--scalar-background-2) 50%, transparent);
  border-radius: var(--scalar-radius-lg) var(--scalar-radius-lg) 0 0;
  padding: 10px;
  margin-bottom: 0;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-bottom: none;
  --scalar-font-size-2: var(--scalar-font-size-4);
}
.callback-operation-container :deep(.parameter-list-items) {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: 0 0 var(--scalar-radius-lg) var(--scalar-radius-lg);
}
.callback-operation-container :deep(.parameter-list-items > li:first-of-type) {
  border-top: none;
}
.callback-operation-container :deep(.parameter-list-items > li) {
  padding: 0 8px;
}
</style>
