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
import type { AuthMeta } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed, onMounted } from 'vue'

import { OperationBlock } from '@/v2/blocks/operation-block'
import type { ExtendedScalarCookie } from '@/v2/blocks/request-block/RequestBlock.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { combineParams } from '@/v2/features/operation/helpers/combine-params'
import { getSelectedServer } from '@/v2/features/operation/helpers/get-selected-server'

const {
  document,
  layout,
  eventBus,
  path,
  method,
  environment,
  exampleName,
  securitySchemes,
  workspaceStore,
  plugins,
  hideClientButton,
} = defineProps<
  RouteProps & {
    hideClientButton?: boolean
  }
>()

/** Find the operation and augment with any path parameters */
const operation = computed(() => {
  if (!path || !method) {
    return null
  }

  const operation = getResolvedRef(document?.paths?.[path]?.[method])
  if (!operation) {
    return null
  }

  const pathItem = getResolvedRef(document?.paths?.[path])
  if (!pathItem) {
    return operation
  }

  // We combine any path parameters with the operation parameters
  const parameters = combineParams(pathItem.parameters, operation.parameters)
  return { ...operation, parameters }
})

/** Combine the workspace and document cookies */
const globalCookies = computed(() => [
  ...((workspaceStore.workspace?.['x-scalar-cookies'] ?? []).map((it) => ({
    ...it,
    location: 'workspace',
  })) satisfies ExtendedScalarCookie[]),
  ...((document?.['x-scalar-cookies'] ?? []).map((it) => ({
    ...it,
    location: 'document',
  })) satisfies ExtendedScalarCookie[]),
])

/** Compute the selected server for the document only for now */
const selectedServer = computed(() => getSelectedServer(document))

onMounted(() => {
  /** Select the first server if the user has not specifically unselected it */
  if (
    typeof document?.['x-scalar-selected-server'] === 'undefined' &&
    document?.servers?.[0]?.url
  ) {
    eventBus.emit('server:update:selected', { url: document.servers[0].url })
  }
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

// eslint-disable-next-line no-undef
const APP_VERSION = PACKAGE_VERSION
</script>

<template>
  <!-- Operation exists -->
  <template v-if="path && method && exampleName && operation">
    <OperationBlock
      :appVersion="APP_VERSION"
      :authMeta
      :documentSecurity="document?.security ?? []"
      :documentSelectedSecurity="document?.['x-scalar-selected-security']"
      :documentUrl="document?.['x-scalar-original-source-url']"
      :environment
      :eventBus
      :exampleKey="exampleName"
      :globalCookies
      :hideClientButton
      :history="[]"
      :httpClients="
        workspaceStore.config['x-scalar-reference-config']?.httpClients
      "
      :layout
      :method
      :operation
      :path
      :plugins="plugins"
      :proxyUrl="workspaceStore.workspace['x-scalar-active-proxy'] ?? ''"
      :securitySchemes
      :selectedClient="workspaceStore.workspace['x-scalar-default-client']"
      :server="selectedServer"
      :servers="document?.servers ?? []"
      :setOperationSecurity="
        document?.['x-scalar-set-operation-security'] ?? false
      "
      @update:servers="
        eventBus.emit('ui:route:page', { name: 'document.servers' })
      " />
  </template>

  <!-- Empty state -->
  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select an operation to view details</span>
  </div>
</template>
