<script lang="ts">
/**
 * Operation example page
 *
 * Displays an operation with a specific example selected
 *  - View example request data
 *  - Modify example request data
 *  - Send example request
 */
export default {}
</script>

<script setup lang="ts">
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed } from 'vue'

import { createStoreEvents } from '@/store/events'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import OperationContainer from '@/v2/features/operation/components/OperationContainer.vue'

const { document, layout, eventBus, path, method, exampleName } =
  defineProps<RouteProps>()

const operation = computed(
  () => path && method && getResolvedRef(document?.paths?.[path]?.[method]),
)

const security = computed(() => {
  if (!operation.value || !document) {
    return []
  }

  return operation.value.security ?? document.security ?? []
})

const APP_VERSION = PACKAGE_VERSION

const environment = {
  uid: '' as any,
  name: '',
  color: '',
  value: '',
}
</script>

<template>
  <template v-if="path && method && exampleName && operation">
    <OperationContainer
      :path="path"
      :method="method"
      :appVersion="APP_VERSION"
      :environment="environment"
      :envVariables="[]"
      :eventBus="eventBus"
      :exampleKey="exampleName"
      :history="[]"
      :layout="layout"
      :plugins="[]"
      :operation="operation"
      :security="security"
      :securitySchemes="document?.components?.securitySchemes ?? {}"
      :selectedSecurity="document?.['x-scalar-selected-security']"
      :server="undefined"
      :servers="[]"
      :events="createStoreEvents()"
      :totalPerformedRequests="0"
      :selectedContentType="'application/json'" />
  </template>
  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select an operation to view details</span>
  </div>
</template>
