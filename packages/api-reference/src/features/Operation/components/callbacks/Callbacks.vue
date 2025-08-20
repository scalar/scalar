<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { CallbackObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'

import type { Schemas } from '@/features/Operation/types/schemas'

import Callback from './Callback.vue'

const {
  path,
  method: operationMethod,
  callbacks,
  schemas,
} = defineProps<{
  path: string
  method: HttpMethod
  callbacks: CallbackObject
  schemas?: Schemas
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
      <!-- Loop over methods -->
      <template v-for="(methods, url) in getResolvedRef(pathItem)">
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
            :schemas="schemas"
            :url="url" />
        </template>
      </template>
    </template>
  </div>
</template>
