<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { CallbackObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import { isReference } from '@scalar/workspace-store/schemas/v3.1/type-guard'

import Callback from './Callback.vue'

const {
  path,
  method: operationMethod,
  callbacks,
} = defineProps<{
  path: string
  method: HttpMethod
  callbacks: CallbackObject
}>()
</script>

<template>
  <div class="callbacks-list gap-3">
    <div class="callbacks-title text-c-1 my-3 text-lg font-medium">
      Callbacks
    </div>

    <!-- Loop over names -->
    <template
      v-for="(pathItem, name) in callbacks"
      :key="name">
      <!-- Make sure its not a ref -->
      <template v-if="!isReference(pathItem)">
        <!-- Loop over methods -->
        <template v-for="(methods, url) in pathItem">
          <!-- Only HTTP Methods -->
          <template
            v-for="(callback, method) in methods"
            :key="method">
            <Callback
              v-if="isHttpMethod(method)"
              :callback="callback"
              :method="method"
              :operationMethod="operationMethod"
              :name="name"
              :path="path"
              :url="url" />
          </template>
        </template>
      </template>
    </template>
  </div>
</template>
