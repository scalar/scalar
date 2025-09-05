<script setup lang="ts">
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconCaretRight } from '@scalar/icons'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { type OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { HttpMethod } from '@/components/HttpMethod'
import OperationParameters from '@/features/Operation/components/OperationParameters.vue'
import OperationResponses from '@/features/Operation/components/OperationResponses.vue'

const { method, name, url } = defineProps<{
  callback: OperationObject
  method: HttpMethodType
  name: string
  url: string
  breadcrumb?: string[]
}>()
</script>

<template>
  <details class="group callback-list-item">
    <!-- Title -->
    <summary
      class="font-code bg-b-1 callback-sticky-offset callback-list-item-title sticky flex cursor-pointer flex-row items-start gap-2 border-t py-3 text-sm group-open:flex-wrap">
      <ScalarIconCaretRight
        class="callback-list-item-icon text-c-3 group-hover:text-c-1 absolute top-3.5 -left-5 size-4 transition-transform duration-100 group-open:rotate-90" />
      <HttpMethod
        as="span"
        class="request-method py-0.75"
        :method="method" />
      <div
        class="text-c-1 min-w-0 flex-1 truncate leading-3 group-open:whitespace-normal">
        {{ name }}
        <span class="text-c-2">
          {{ url }}
        </span>
      </div>
    </summary>

    <!-- Body -->
    <div class="callback-operation-container flex flex-col gap-2">
      <OperationParameters
        :parameters="
          callback.parameters?.map((param) => getResolvedRef(param)) ?? []
        "
        :requestBody="getResolvedRef(callback.requestBody)" />

      <!-- Responses -->
      <OperationResponses
        :collapsableItems="false"
        :responses="callback.responses" />
    </div>
  </details>
</template>
<style scoped>
.callback-sticky-offset {
  top: var(--refs-header-height, 0px);
  z-index: 100;
}
.callback-operation-container :deep(.request-body),
.callback-operation-container :deep(.request-body-description),
.callback-operation-container :deep(.request-body-header) {
  margin-top: 0;
}
.callback-operation-container :deep(.request-body-header) {
  --scalar-font-size-2: var(--scalar-font-size-4);
  padding: 8px;
  border-bottom: none;
  border: 0.5px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg) var(--scalar-radius-lg) 0 0;
  background: color-mix(in srgb, var(--scalar-background-2) 50%, transparent);
}
.callback-operation-container :deep(ul li.property.property--level-1) {
  padding: 8px;
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
  padding: 8px;
  margin-bottom: 0;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-bottom: none;
  --scalar-font-size-2: var(--scalar-font-size-4);
}
.callback-operation-container :deep(.parameter-list-items) {
  /* background: pink; */
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
