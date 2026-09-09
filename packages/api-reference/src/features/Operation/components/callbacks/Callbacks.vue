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

import { SectionHeaderTag } from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
import { useLocalization } from '@/features/localization'
import type { OperationProps } from '@/features/Operation/Operation.vue'

import Callback from './Callback.vue'

const { path, callbacks, breadcrumb } = defineProps<{
  path: string
  callbacks: CallbackObject
  eventBus: WorkspaceEventBus | null
  /** Breadcrumb of the owning operation; extended per callback below */
  breadcrumb?: string[]
  /** The document the callbacks belong to, used to resolve schema references for display */
  document?: OpenApiDocument
  options: Pick<
    OperationProps['options'],
    | 'hideModels'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
    | 'schemaKeyboardNav'
  >
}>()
const { translate } = useLocalization()

const { level: headingLevel } = useDocumentOutline('operationSection')

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
    objectEntries(getResolvedRef(pathItem) ?? {}).forEach(([url, methods]) => {
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
    <!-- The heading carries the rule; the callback row pads itself, so no bottom margin -->
    <SectionHeaderTag
      class="callbacks-title text-c-1 callbacks-title--tree mt-3 mb-0 block! text-lg font-medium"
      :level="headingLevel"
      rule>
      {{ translate('operation.callbacks') }}
    </SectionHeaderTag>
    <!-- The url is part of a callback's identity (one name can carry several
         urls), so name + method alone would collide on one expansion key -->
    <Callback
      v-for="{ callback, method, name, url } in flattenedCallbacks"
      :key="`${name}-${url}-${method}`"
      :breadcrumb="
        breadcrumb ? [...breadcrumb, 'callbacks', name, url, method] : undefined
      "
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
