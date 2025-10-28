<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { CallbackObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import Callback from './Callback.vue'

const {
  path,
  method: operationMethod,
  callbacks,
} = defineProps<{
  path: string
  method: HttpMethod
  callbacks: CallbackObject
  eventBus: WorkspaceEventBus | null
  options: {
    collapsableItems?: boolean
    withExamples?: boolean
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()
</script>

<template>
  <div
    aria-label="Callbacks"
    class="callbacks-list gap-3"
    role="group">
    <div class="callbacks-title text-c-1 my-3 text-lg font-medium">
      Callbacks
    </div>
    <!-- Loop over names -->
    <template
      v-for="(pathItem, name) in callbacks"
      :key="name">
      <!-- Loop over methods -->
      <template v-for="(methods, url) in getResolvedRef(pathItem)">
        <!-- Only HTTP Methods -->
        <template
          v-for="(callback, callbackMethod) in methods"
          :key="callbackMethod">
          <Callback
            v-if="isHttpMethod(callbackMethod)"
            :callback="callback"
            :eventBus="eventBus"
            :method="callbackMethod"
            :name="name"
            :operationMethod="operationMethod"
            :options="options"
            :path="path"
            :url="url" />
        </template>
      </template>
    </template>
  </div>
</template>
