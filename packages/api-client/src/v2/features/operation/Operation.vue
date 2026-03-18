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
import { computed, toValue } from 'vue'

import { OperationBlock } from '@/v2/blocks/operation-block'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { mapHiddenClientsConfig } from '@/v2/features/modal/helpers/map-hidden-clients-config'
import type { ModalProps } from '@/v2/features/modal/Modal.vue'
import { useOperationRequestContext } from '@/v2/features/operation/use-operation-request-context'

const {
  document,
  layout,
  eventBus,
  path,
  method,
  exampleName,
  options,
  workspaceStore,
  plugins,
  documentSlug,
} = defineProps<
  RouteProps & {
    /** Subset of config options for the modal */
    options?: ModalProps['options']
  }
>()

/** Derive environment, server, operation, auth, and executeRequest from workspace + document + path + method */
const requestContext = useOperationRequestContext({
  workspaceStore,
  document,
  path,
  method,
  documentSlug,
  layout,
  exampleKey: exampleName,
  eventBus,
  plugins,
  options,
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
  <template
    v-if="
      path &&
      method &&
      exampleName &&
      requestContext.operation.value &&
      document
    ">
    <OperationBlock
      :activeEnvironment="requestContext.activeEnvironment.value"
      :appVersion="APP_VERSION"
      :authMeta="requestContext.authMeta.value"
      :documentSecurity="document?.security ?? []"
      :documentSelectedSecurity="requestContext.documentSelectedSecurity.value"
      :documentUrl="document?.['x-scalar-original-source-url']"
      :environment="requestContext.environment.value"
      :environments="requestContext.environments.value"
      :eventBus
      :exampleKey="exampleName"
      :executeRequest="requestContext.executeRequest"
      :globalCookies="requestContext.globalCookies.value"
      :hideClientButton="toValue(options)?.hideClientButton ?? false"
      :history="workspaceStore.history.getHistory(documentSlug, path, method)"
      :httpClients
      :layout
      :method
      :operation="requestContext.operation.value"
      :operationSelectedSecurity="
        requestContext.operationSelectedSecurity.value
      "
      :path
      :plugins="plugins"
      :proxyUrl="requestContext.proxyUrl.value"
      :securitySchemes="requestContext.securitySchemes.value"
      :selectedClient="workspaceStore.workspace['x-scalar-default-client']"
      :server="requestContext.server.value"
      :serverMeta="requestContext.serverMeta.value"
      :servers="requestContext.servers.value" />
  </template>

  <!-- Empty state -->
  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select an operation to view details</span>
  </div>
</template>
