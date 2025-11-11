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
import { OperationBlock } from '@/v2/blocks/operation-block'
import type { RouteProps } from '@/v2/features/app/helpers/routes'

const { document, layout, eventBus, path, method, environment, exampleName } =
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

/** Select document vs operation meta based on the extension */
const authMeta = computed<AuthMeta>(() => {
  if (isOperationAuth.value) {
    return {
      type: 'operation',
      path: path ?? '',
      method: method ?? 'get',
    } as const
  }

  return {
    type: 'document',
  } as const
})

const APP_VERSION = PACKAGE_VERSION
</script>

<template>
  <template v-if="path && method && exampleName && operation">
    <OperationBlock
      :appVersion="APP_VERSION"
      :authMeta="authMeta"
      :environment="environment"
      :eventBus="eventBus"
      :events="createStoreEvents()"
      :exampleKey="exampleName"
      :history="[]"
      :layout="layout"
      :method="method"
      :operation="operation"
      :path="path"
      :plugins="[]"
      :security="security"
      :securitySchemes="document?.components?.securitySchemes ?? {}"
      :selectedSecurity="selectedSecurity"
      :server="undefined"
      :servers="[]"
      :totalPerformedRequests="0" />
  </template>
  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select an operation to view details</span>
  </div>
</template>
