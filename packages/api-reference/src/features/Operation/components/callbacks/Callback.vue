<script setup lang="ts">
import { ScalarIconCaretRight } from '@scalar/icons'
import { requestSchema, type Collection } from '@scalar/oas-utils/entities/spec'
import { schemaModel } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1 } from '@scalar/types/legacy'
import { computed } from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import OperationParameters from '@/features/Operation/components/OperationParameters.vue'
import OperationResponses from '@/features/Operation/components/OperationResponses.vue'
import type { Schemas } from '@/features/Operation/types/schemas'

const { callback, collection, method, name, schemas, url } = defineProps<{
  callback: OpenAPIV3_1.OperationObject
  collection: Collection
  method: string
  name: string
  schemas?: Schemas
  url: string
}>()

/** This should get us 90% of the way there, will fix the rest on new store */
const operation = computed(() =>
  schemaModel({ ...callback, path: url, method }, requestSchema, false),
)
</script>

<template>
  <details
    v-if="collection && operation"
    class="group">
    <!-- Title -->
    <summary
      class="font-code bg-b-1 callback-sticky-offset sticky flex cursor-pointer flex-row items-center gap-2 border-t py-3 text-sm group-open:flex-wrap">
      <ScalarIconCaretRight
        class="text-c-3 group-hover:text-c-1 absolute -left-5 size-4 transition-transform group-open:rotate-90" />
      <HttpMethod
        as="span"
        class="request-method"
        :method="method" />
      <div class="text-c-1 truncate leading-3 group-open:whitespace-normal">
        {{ name }}
        <span class="text-c-2">
          {{ url }}
        </span>
      </div>
    </summary>

    <!-- Body -->
    <div class="callback-operation-container flex flex-col gap-2">
      <OperationParameters
        :requestBody="callback.requestBody"
        :parameters="callback.parameters"
        :schemas="schemas" />

      <!-- Responses -->
      <OperationResponses
        :collapsableItems="false"
        :responses="callback.responses"
        :schemas="schemas" />
    </div>
  </details>
</template>
<style scoped>
.callback-sticky-offset {
  top: var(--refs-header-height, 0px);
  z-index: 100;
}
.callback-operation-container :deep(.request-body-header) {
  --scalar-font-size-2: var(--scalar-font-size-4);
  margin-top: 0;
  padding: 8px;
  border-bottom: none;
  border: 0.5px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg) var(--scalar-radius-lg) 0 0;
  background: color-mix(in srgb, var(--scalar-background-2) 50%, transparent);
}
.callback-operation-container :deep(.request-body-description) {
  margin-top: 0;
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
