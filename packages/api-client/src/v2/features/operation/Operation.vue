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
import { computed, toRef, toValue } from 'vue'

import { OperationBlock } from '@/v2/blocks/operation-block'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { mapHiddenClientsConfig } from '@/v2/features/modal/helpers/map-hidden-clients-config'
import type { ModalProps } from '@/v2/features/modal/Modal.vue'
import { useOperationRequestContext } from '@/v2/features/operation/use-operation-request-context'

const props = defineProps<
  RouteProps & {
    /** Subset of config options for the modal */
    options?: ModalProps['options']
  }
>()

/** Pass refs so context updates when route/operation/example changes */
const requestContext = useOperationRequestContext({
  workspaceStore: toRef(props, 'workspaceStore'),
  document: toRef(props, 'document'),
  path: toRef(props, 'path'),
  method: toRef(props, 'method'),
  documentSlug: toRef(props, 'documentSlug'),
  layout: toRef(props, 'layout'),
  exampleKey: computed(() => props.exampleName ?? 'default'),
  eventBus: toRef(props, 'eventBus'),
  plugins: toRef(props, 'plugins'),
  options: toRef(props, 'options'),
})

/** Temporarily use the old config.hiddenClients until we migrate to the new httpClients config */
const httpClients = computed(() =>
  mapHiddenClientsConfig(toValue(props.options)?.hiddenClients),
)

// eslint-disable-next-line no-undef
const APP_VERSION = PACKAGE_VERSION
</script>

<template>
  <!-- Operation exists -->
  <template
    v-if="
      props.path &&
      props.method &&
      props.exampleName &&
      requestContext.operation.value &&
      props.document
    ">
    <OperationBlock
      :activeEnvironment="requestContext.activeEnvironment.value"
      :appVersion="APP_VERSION"
      :authMeta="requestContext.authMeta.value"
      :documentSecurity="props.document?.security ?? []"
      :documentSelectedSecurity="requestContext.documentSelectedSecurity.value"
      :documentUrl="props.document?.['x-scalar-original-source-url']"
      :environment="requestContext.environment.value"
      :environments="requestContext.environments.value"
      :eventBus="props.eventBus"
      :exampleKey="props.exampleName"
      :executeRequest="requestContext.executeRequest"
      :globalCookies="requestContext.globalCookies.value"
      :hideClientButton="toValue(props.options)?.hideClientButton ?? false"
      :history="
        props.workspaceStore.history.getHistory(
          props.documentSlug,
          props.path,
          props.method,
        )
      "
      :httpClients
      :layout="props.layout"
      :method="props.method"
      :operation="requestContext.operation.value"
      :operationSelectedSecurity="
        requestContext.operationSelectedSecurity.value
      "
      :path="props.path"
      :plugins="props.plugins"
      :proxyUrl="requestContext.proxyUrl.value"
      :securitySchemes="requestContext.securitySchemes.value"
      :selectedClient="
        props.workspaceStore.workspace['x-scalar-default-client']
      "
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
