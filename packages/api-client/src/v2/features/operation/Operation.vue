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
import { computed, onMounted, watch } from 'vue'

import { OperationBlock } from '@/v2/blocks/operation-block'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { getOperationHeader } from '@/v2/features/operation/helpers/get-operation-header'
// import { getOperationHeader } from '@/v2/features/operation/helpers/get-operation-header'
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
} = defineProps<RouteProps>()

const operation = computed(() =>
  path && method
    ? (getResolvedRef(document?.paths?.[path]?.[method]) ?? null)
    : null,
)

/** Combine the workspace and document cookies */
const globalCookies = computed(() => [
  ...(workspaceStore.workspace?.['x-scalar-cookies'] ?? []),
  ...(document?.['x-scalar-cookies'] ?? []),
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

/** Add the Accept header to the operation if it doesn't exist */
watch(
  operation,
  (newOperation) => {
    if (
      newOperation &&
      path &&
      method &&
      !getOperationHeader({
        operation: newOperation,
        name: 'Accept',
        type: 'header',
      })
    ) {
      eventBus.emit('operation:add:parameter', {
        type: 'header',
        meta: { method, path, exampleKey: exampleName ?? 'default' },
        payload: {
          key: 'Accept',
          value: '*/*',
          isDisabled: false,
        },
      })
    }
  },
  { immediate: true },
)

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
      :totalPerformedRequests="0"
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
