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
import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type { AuthMeta, ServerMeta } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed, toValue } from 'vue'

import { OperationBlock } from '@/v2/blocks/operation-block'
import type { ExtendedScalarCookie } from '@/v2/blocks/request-block/RequestBlock.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { mapHiddenClientsConfig } from '@/v2/features/modal/helpers/map-hidden-clients-config'
import type { ModalProps } from '@/v2/features/modal/Modal.vue'
import { combineParams } from '@/v2/features/operation/helpers/combine-params'
import { getSelectedServer } from '@/v2/features/operation/helpers/get-selected-server'
import { getActiveProxyUrl } from '@/v2/helpers/get-active-proxy-url'
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
  documentSlug,
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
    // pathItem.value?.servers ?? TODO: add support for pathItem servers
    document?.servers

  return getServers(_servers, {
    baseServerUrl: toValue(options)?.baseServerURL,
    documentUrl: document?.['x-scalar-original-source-url'],
  })
})

/** Selected server URL from the same source as servers: operation, then document (config has no stored selection so use document selection) */
const selectedServerUrl = computed(() => {
  if (toValue(options)?.servers != null) {
    return document?.['x-scalar-selected-server']
  }
  if (operation.value?.servers != null) {
    return operation.value['x-scalar-selected-server']
  }
  return document?.['x-scalar-selected-server']
})

/** Selected server for the operation (document-level or operation-level servers) */
const selectedServer = computed(() =>
  getSelectedServer(servers.value, selectedServerUrl.value),
)

const serverMeta = computed<ServerMeta>(() => {
  if (operation.value?.servers != null) {
    return { type: 'operation', path: path ?? '', method: method ?? 'get' }
  }
  return { type: 'document' }
})

const documentSelectedSecurity = computed<SelectedSecurity | undefined>(() => {
  return workspaceStore.auth.getAuthSelectedSchemas({
    type: 'document',
    documentName: documentSlug,
  })
})

const operationSelectedSecurity = computed<SelectedSecurity | undefined>(() => {
  return workspaceStore.auth.getAuthSelectedSchemas({
    type: 'operation',
    documentName: documentSlug,
    path: path ?? '',
    method: method ?? 'get',
  })
})

/** Select document vs operation meta based on the extension */
const authMeta = computed<AuthMeta>(() => {
  if (operationSelectedSecurity.value !== undefined) {
    return {
      type: 'operation',
      path: path ?? '',
      method: method ?? 'get',
    }
  }

  return { type: 'document' }
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
      :documentSelectedSecurity="documentSelectedSecurity"
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
      :operationSelectedSecurity="operationSelectedSecurity"
      :path
      :plugins="plugins"
      :proxyUrl="
        getActiveProxyUrl(
          workspaceStore.workspace['x-scalar-active-proxy'],
          layout,
        ) ?? ''
      "
      :securitySchemes
      :selectedClient="workspaceStore.workspace['x-scalar-default-client']"
      :server="selectedServer"
      :serverMeta
      :servers />
  </template>

  <!-- Empty state -->
  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select an operation to view details</span>
  </div>
</template>
