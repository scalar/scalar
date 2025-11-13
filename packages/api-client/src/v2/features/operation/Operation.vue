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
import { useRouter } from 'vue-router'

import { createStoreEvents } from '@/store/events'
import { OperationBlock } from '@/v2/blocks/operation-block'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { getSecurityRequirements } from '@/v2/features/operation/helpers/get-security-requirements'

const { document, layout, eventBus, path, method, environment, exampleName } =
  defineProps<RouteProps>()

const operation = computed(() =>
  path && method
    ? getResolvedRef(document?.paths?.[path]?.[method])
    : undefined,
)

/** Compute what the security requirements should be for a request */
const security = computed(() =>
  getSecurityRequirements(document, operation.value),
)

/** Compute the selected server for the document only for now */
const selectedServer = computed(
  () =>
    document?.servers?.find(
      ({ url }) => url === document?.['x-scalar-selected-server'],
    ) ?? null,
)

/** Select the selected security for the operation or document */
const selectedSecurity = computed(() => {
  if (document?.['x-scalar-set-operation-security']) {
    return operation.value?.['x-scalar-selected-security']
  }

  return document?.['x-scalar-selected-security']
})

/** Select document vs operation meta based on the extension */
const authMeta = computed<AuthMeta>(() => {
  if (document?.['x-scalar-set-operation-security']) {
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

const router = useRouter()
</script>

<template>
  <!-- Operation exists -->
  <template v-if="path && method && exampleName && operation">
    <OperationBlock
      :appVersion="APP_VERSION"
      :authMeta
      :environment
      :eventBus
      :events="createStoreEvents()"
      :exampleKey="exampleName"
      :history="[]"
      :layout
      :method
      :operation
      :path
      :plugins="[]"
      :security="security"
      :securitySchemes="document?.components?.securitySchemes ?? {}"
      :selectedSecurity
      :server="selectedServer"
      :servers="document?.servers ?? []"
      :totalPerformedRequests="0"
      @update:servers="router.push({ name: 'document.servers' })" />
  </template>

  <!-- Empty state -->
  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select an operation to view details</span>
  </div>
</template>
