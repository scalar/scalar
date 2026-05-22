<script lang="ts">
/**
 * Channel operation page for AsyncAPI WebSocket operations.
 *
 * Displays channel parameters, authentication, message editor, and a live connection log.
 */
export default {}

export type ChannelOperationProps = {
  /** The slug of the currently selected document in the workspace */
  documentSlug: string
  /** The currently active AsyncAPI document */
  document: AsyncApiDocument | null
  /** The workspace event bus */
  eventBus: WorkspaceEventBus
  /** The layout of the client */
  layout: ClientLayout
  /** AsyncAPI operation name (key in document.operations) */
  operationName?: string
  /** The currently active environment */
  environment: XScalarEnvironment
  /** The workspace store */
  workspaceStore: WorkspaceStore
  /** Client plugins */
  plugins: ClientPlugin[]
  /** App or modal options forwarded to channel/auth blocks */
  options?: MaybeRefOrGetter<ApiClientOptions>
}
</script>

<script setup lang="ts">
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getChannelExampleContext } from '@scalar/workspace-store/channel-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { ChannelOperationBlock } from '@/v2/blocks/channel-operation-block'
import type { ClientLayout } from '@/v2/types/layout'
import type { ApiClientOptions } from '@/v2/types/options'

const {
  document,
  documentSlug,
  eventBus,
  layout,
  operationName,
  options,
  plugins,
  workspaceStore,
} = defineProps<ChannelOperationProps>()

const channelExample = computed(() => {
  if (!operationName || !document) {
    return null
  }

  const result = getChannelExampleContext(
    workspaceStore,
    documentSlug,
    { operationName },
    {
      fallbackDocument: document,
      authentication: toValue(options)?.authentication,
    },
  )

  return result.ok ? result.data : null
})
</script>

<template>
  <template v-if="operationName && document && channelExample">
    <ChannelOperationBlock
      :authMeta="channelExample.security.meta"
      :channel="channelExample.channel"
      :connectionUrl="channelExample.connectionUrl"
      :documentSlug="documentSlug"
      :environment="channelExample.environment.environment"
      :eventBus="eventBus"
      :layout="layout"
      :messages="channelExample.messages"
      :operation="channelExample.operation"
      :operationName="operationName"
      :options="toValue(options)"
      :parameters="channelExample.parameters"
      :plugins="plugins"
      :securityRequirements="channelExample.security.requirements"
      :securitySchemes="channelExample.security.schemes"
      :selectedMessage="channelExample.selectedMessage"
      :selectedSecurity="channelExample.security.selected"
      :selectedSecuritySchemes="channelExample.security.selectedSchemes"
      :selectedServer="channelExample.servers.selected"
      :servers="channelExample.servers.list"
      :workspaceStore="workspaceStore" />
  </template>

  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select a channel operation to view details</span>
  </div>
</template>
