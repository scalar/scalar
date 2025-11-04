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
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import { computed } from 'vue'

import { createStoreEvents } from '@/store/events'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import OperationContainer from '@/v2/features/operation/components/OperationContainer.vue'

const { document, layout, eventBus, path, method, exampleName } =
  defineProps<RouteProps>()

const operation = computed(() =>
  path && method
    ? getResolvedRef(document?.paths?.[path]?.[method])
    : undefined,
)

const isOperationAuth = computed(
  () =>
    (operation.value?.security?.length ?? 0) > 0 &&
    JSON.stringify(operation.value?.security) !== '[{}]',
)

// Compute the security requirements for the operation
const security = computed(() => {
  if (!operation.value || !document) {
    return []
  }

  if (isOperationAuth.value) {
    return operation.value.security ?? []
  }

  if (JSON.stringify(operation.value?.security) === '[{}]') {
    return [...(document.security ?? []), {}]
  }

  return document.security ?? []
})

const selectedSecurity = computed(() => {
  if (isOperationAuth.value) {
    return operation.value?.['x-scalar-selected-security']
  }

  return document?.['x-scalar-selected-security']
})

const authMeta = computed<AuthMeta>(() => {
  if (isOperationAuth.value) {
    return {
      type: 'operation' as const,
      path,
      method,
    }
  }

  return {
    type: 'document' as const,
  }
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
      :authMeta="authMeta"
      :security="security"
      :securitySchemes="document?.components?.securitySchemes ?? {}"
      :selectedSecurity="selectedSecurity"
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
