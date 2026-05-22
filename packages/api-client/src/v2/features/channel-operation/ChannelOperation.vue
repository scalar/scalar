<script lang="ts">
/**
 * AsyncAPI channel connection page — one WebSocket channel at a time (Postman-style),
 * with messages, servers, and parameters from the AsyncAPI description.
 */
export default {}

export type ChannelOperationProps = {
  documentSlug: string
  document: AsyncApiDocument | null
  eventBus: WorkspaceEventBus
  layout: ClientLayout
  /** Channel key in `document.channels` */
  channelName?: string
  environment: XScalarEnvironment
  workspaceStore: WorkspaceStore
  plugins: ClientPlugin[]
  options?: MaybeRefOrGetter<ApiClientOptions>
}
</script>

<script setup lang="ts">
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getChannelConnectionContext } from '@scalar/workspace-store/channel-example'
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
  channelName,
  options,
  plugins,
  workspaceStore,
} = defineProps<ChannelOperationProps>()

const channelConnection = computed(() => {
  if (!channelName || !document) {
    return null
  }

  // Track selected server so the connection bar updates when the user switches servers.
  const workspaceDocument = workspaceStore.workspace.documents[documentSlug]
  const selectedServerName = workspaceDocument?.['x-scalar-selected-server']

  const result = getChannelConnectionContext(
    workspaceStore,
    documentSlug,
    { channelName },
    {
      fallbackDocument: document,
      authentication: toValue(options)?.authentication,
    },
  )

  if (!result.ok) {
    return null
  }

  void selectedServerName
  return result.data
})
</script>

<template>
  <template v-if="channelName && document && channelConnection">
    <ChannelOperationBlock
      :authMeta="channelConnection.security.meta"
      :channel="channelConnection.channel"
      :channelAddress="channelConnection.channelAddress"
      :channelName="channelName"
      :connectionUrl="channelConnection.connectionUrl"
      :documentSlug="documentSlug"
      :environment="channelConnection.environment.environment"
      :eventBus="eventBus"
      :layout="layout"
      :messages="channelConnection.messages"
      :operations="channelConnection.operations"
      :options="toValue(options)"
      :parameters="channelConnection.parameters"
      :plugins="plugins"
      :securityRequirements="channelConnection.security.requirements"
      :securitySchemes="channelConnection.security.schemes"
      :selectedMessage="channelConnection.selectedMessage"
      :selectedSecurity="channelConnection.security.selected"
      :selectedSecuritySchemes="channelConnection.security.selectedSchemes"
      :selectedServer="channelConnection.servers.selected"
      :servers="channelConnection.servers.list"
      :workspaceStore="workspaceStore" />
  </template>

  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select a channel to test the WebSocket connection</span>
  </div>
</template>
