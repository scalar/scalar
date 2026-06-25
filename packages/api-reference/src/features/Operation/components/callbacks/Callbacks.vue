<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  CallbackObject,
  OpenApiDocument,
  OperationObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'
import type { OperationProps } from '@/features/Operation/Operation.vue'

import Callback from './Callback.vue'

const { path, callbacks, options } = defineProps<{
  path: string
  callbacks: CallbackObject
  eventBus: WorkspaceEventBus | null
  /** The document the callbacks belong to, used to resolve schema references for display */
  document?: OpenApiDocument
  options: Pick<
    OperationProps['options'],
    | 'hideModels'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
  >
}>()
const { translate } = useLocalization()

type CallbackType = {
  name: string
  url: string
  method: HttpMethod
  callback: OperationObject
}

/** Extract the callbacks with method, url, and name */
const flattenedCallbacks = computed<CallbackType[]>(() => {
  const _callbacks: CallbackType[] = []

  // Loop over the name level
  objectEntries(callbacks).forEach(([name, pathItem]) => {
    // Loop over the url level
    objectEntries(getResolvedRef(pathItem)).forEach(([url, methods]) => {
      if (typeof methods !== 'object' || !methods) {
        return
      }

      // Loop over the method level
      objectEntries(methods).forEach(([callbackMethod, callback]) => {
        if (!isHttpMethod(callbackMethod)) {
          return
        }

        _callbacks.push({
          name,
          url,
          method: callbackMethod,
          callback: callback,
        })
      })
    })
  })

  return _callbacks
})
</script>

<template>
  <div
    :aria-label="translate('operation.callbacks')"
    class="callbacks-list gap-3"
    role="group">
    <div class="callbacks-title text-c-1 my-3 text-lg font-medium">
      {{ translate('operation.callbacks') }}
    </div>
    <Callback
      v-for="{ callback, method, name, url } in flattenedCallbacks"
      :key="`${name}-${url}-${method}`"
      :callback
      :document
      :eventBus
      :method
      :name
      :options
      :path
      :url />
  </div>
</template>
