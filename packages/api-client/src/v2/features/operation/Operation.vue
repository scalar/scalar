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
import { computed, onMounted, toValue } from 'vue'

import { OperationBlock } from '@/v2/blocks/operation-block'
import type { ExtendedScalarCookie } from '@/v2/blocks/request-block/RequestBlock.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { mapHiddenClientsConfig } from '@/v2/features/modal/helpers/map-hidden-clients-config'
import type { ModalProps } from '@/v2/features/modal/Modal.vue'
import { combineParams } from '@/v2/features/operation/helpers/combine-params'
import { getSelectedServer } from '@/v2/features/operation/helpers/get-selected-server'
import { getServers } from '@/v2/helpers/get-servers'

const {
  document,
  layout,
  eventBus,
  path,
  method,
  environment,
  exampleName,
  options,
  securitySchemes,
  workspaceStore,
  plugins,
} = defineProps<
  RouteProps & {
    /** Subset of config options for the modal */
    options?: ModalProps['options']
  }
>()

/** Grab the path item object from the document */
const pathItem = computed(() => {
  if (!path) {
    return null
  }
  return getResolvedRef(document?.paths?.[path])
})

/** Find the operation and augment with any path parameters */
const operation = computed(() => {
  if (!path || !method) {
    return null
  }

  const operation = getResolvedRef(document?.paths?.[path]?.[method])
  if (!operation) {
    return null
  }

  if (!pathItem.value) {
    return operation
  }

  // We combine any path parameters with the operation parameters
  const parameters = combineParams(
    pathItem.value.parameters,
    operation.parameters,
  )
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

/** Compute the servers for the operation */
const servers = computed(() => {
  /**
   * Gather all the servers from the config, operation, pathItem, and document
   */
  const _servers =
    toValue(options)?.servers ??
    operation.value?.servers ??
    pathItem.value?.servers ??
    document?.servers

  return getServers(_servers, {
    baseServerUrl: toValue(options)?.baseServerURL,
    documentUrl: document?.['x-scalar-original-source-url'],
  })
})

/** Compute the selected server for the document only for now */
const selectedServer = computed(() =>
  getSelectedServer(document, servers.value),
)

onMounted(() => {
  /** Select the first server if the user has not specifically unselected it */
  if (
    typeof document?.['x-scalar-selected-server'] === 'undefined' &&
    servers.value?.[0]?.url
  ) {
    eventBus.emit('server:update:selected', { url: servers.value[0]!.url })
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

/** Combine environments from document and workspace into a unique array of environment names */
const environments = computed(() => {
  return Array.from(
    new Set(
      Object.keys({
        ...document?.['x-scalar-environments'],
        ...workspaceStore.workspace['x-scalar-environments'],
      }),
    ),
  )
})

/** Temporarily use the old config.hiddenClients until we migrate to the new httpClients config */
const httpClients = computed(() =>
  mapHiddenClientsConfig(toValue(options)?.hiddenClients),
)

// eslint-disable-next-line no-undef
const APP_VERSION = PACKAGE_VERSION
</script>

<template>
  <!-- Operation exists -->
  <template v-if="path && method && exampleName && operation">
    <OperationBlock
      :activeEnvironment="
        workspaceStore.workspace['x-scalar-active-environment']
      "
      :appVersion="APP_VERSION"
      :authMeta
      :documentSecurity="document?.security ?? []"
      :documentSelectedSecurity="
        workspaceStore.auth.getAuthSelectedSchemas({
          type: 'document',
          documentName: documentSlug,
        })
      "
      :documentUrl="document?.['x-scalar-original-source-url']"
      :environment
      :environments
      :eventBus
      :exampleKey="exampleName"
      :globalCookies
      :hideClientButton="toValue(options)?.hideClientButton ?? false"
      :history="workspaceStore.history.getHistory(documentSlug, path, method)"
      :httpClients
      :layout
      :method
      :operation
      :operationSelectedSecurity="
        workspaceStore.auth.getAuthSelectedSchemas({
          type: 'operation',
          documentName: documentSlug,
          path,
          method,
        })
      "
      :path
      :plugins="plugins"
      :proxyUrl="workspaceStore.workspace['x-scalar-active-proxy'] ?? ''"
      :securitySchemes
      :selectedClient="workspaceStore.workspace['x-scalar-default-client']"
      :server="selectedServer"
      :servers
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
