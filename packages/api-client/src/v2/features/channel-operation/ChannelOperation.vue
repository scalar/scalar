<script lang="ts">
/**
 * Channel operation page
 *
 * Displays an AsyncAPI channel with a WebSocket connection editor, auth, messages,
 * and a live frame log.
 */
export default {
  name: 'ChannelOperation',
}

type ChannelOperationProps = {
  /** The slug of the currently selected document in the workspace */
  documentSlug: string
  /** The currently active document - AsyncAPI-only, the channel page has no OpenAPI path */
  document: AsyncApiDocument | null
  /** The workspace event bus */
  eventBus: WorkspaceEventBus
  /** The layout of the client */
  layout: ClientLayout
  /** The AsyncAPI channel currently selected */
  channelName?: string
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
import {
  getChannelConnectionContext,
  type BuildChannelConnectionContext,
} from '@scalar/workspace-store/channel-example'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { ChannelOperationBlock } from '@/v2/blocks/channel-operation-block'
import type { ClientLayout } from '@/v2/types/layout'
import type { ApiClientOptions } from '@/v2/types/options'

const {
  channelName,
  document,
  documentSlug,
  environment,
  eventBus,
  layout,
  options,
  plugins,
  workspaceStore,
} = defineProps<ChannelOperationProps>()

const channelConnection = computed((): BuildChannelConnectionContext | null => {
  if (!channelName || !document) {
    return null
  }

  const result = getChannelConnectionContext(
    workspaceStore,
    documentSlug,
    { channelName },
    {
      authentication: toValue(options)?.authentication,
      fallbackDocument: document,
    },
  )

  return result.ok ? result.data : null
})

const resolvedOptions = computed(() => toValue(options))
</script>

<template>
  <ChannelOperationBlock
    v-if="channelConnection"
    :authMeta="channelConnection.security.meta"
    :channel="channelConnection.channel"
    :channelAddress="channelConnection.channelAddress"
    :channelName="channelConnection.channelName"
    :connectionUrl="channelConnection.connectionUrl"
    :documentSlug
    :environment
    :eventBus
    :layout
    :messages="channelConnection.messages"
    :operations="channelConnection.operations"
    :options="resolvedOptions"
    :parameters="channelConnection.parameters"
    :plugins
    :securityRequirements="channelConnection.security.requirements"
    :securitySchemes="channelConnection.security.schemes"
    :selectedMessage="channelConnection.selectedMessage"
    :selectedSecurity="channelConnection.security.selected"
    :selectedSecuritySchemes="channelConnection.security.selectedSchemes"
    :selectedServer="channelConnection.servers.selected"
    :servers="channelConnection.servers.list"
    :workspaceStore />

  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select a channel to view details</span>
  </div>
</template>
