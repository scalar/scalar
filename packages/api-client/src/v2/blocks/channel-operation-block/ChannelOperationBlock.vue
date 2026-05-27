<script lang="ts">
/**
 * Channel connection block: Postman-style WebSocket testing for one AsyncAPI channel at a time.
 */
export default {
  name: 'ChannelOperationBlock',
}

export type ChannelOperationBlockProps = {
  eventBus: WorkspaceEventBus
  documentSlug: string
  layout: ClientLayout
  workspaceStore: WorkspaceStore
  channelName: string
  channel: AsyncApiChannelObject
  channelAddress: string
  operations: ChannelOperationSummary[]
  connectionUrl: string
  parameters: ChannelParametersContext
  messages: ChannelMessageEntry[]
  selectedMessage: ChannelMessageEntry | null
  servers: AsyncApiServerEntry[]
  selectedServer: AsyncApiServerEntry | null
  environment: XScalarEnvironment
  securitySchemes: MergedSecuritySchemes
  securityRequirements: OpenApiDocument['security']
  selectedSecurity: SelectedSecurity
  selectedSecuritySchemes: SecuritySchemeObjectSecret[]
  authMeta: AuthMeta
  plugins: ClientPlugin[]
  options?: ApiClientOptions
}
</script>

<script setup lang="ts">
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { AsyncApiChannelObject } from '@scalar/types/asyncapi/3.1'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { useToasts } from '@scalar/use-toasts'
import {
  buildConnectionUrl,
  type AsyncApiServerEntry,
  type ChannelMessageEntry,
  type ChannelOperationSummary,
  type ChannelParametersContext,
} from '@scalar/workspace-store/channel-example'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type {
  AuthMeta,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import {
  getEnvironmentVariables,
  type MergedSecuritySchemes,
  type SecuritySchemeObjectSecret,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OpenApiDocument,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  computed,
  onBeforeUnmount,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import {
  connectWebSocket,
  createWebSocketSession,
  WEBSOCKET_CONNECTION_FAILED_MESSAGE,
} from '@/v2/blocks/channel-operation-block'
import { getMessagePayloadExample } from '@/v2/blocks/channel-operation-block/helpers/get-message-payload-example'
import type {
  WebSocketConnectionLogEntry,
  WebSocketFrame,
} from '@/v2/blocks/channel-operation-block/helpers/websocket-session'
import type { ClientLayout } from '@/v2/types/layout'
import type { ApiClientOptions } from '@/v2/types/options'

import ChannelRequestBlock from './components/ChannelRequestBlock.vue'
import ConnectionBar from './components/ConnectionBar.vue'
import ConnectionPanel from './components/ConnectionPanel.vue'

const props = defineProps<ChannelOperationBlockProps>()

const { toast } = useToasts()
const { copyToClipboard } = useClipboard()

const connectionBarRef = useTemplateRef('connectionBarRef')
const wsSession = shallowRef(createWebSocketSession())
const sessionState = ref(wsSession.value.state)
const messageFrames = ref<WebSocketFrame[]>([])
const connectionLogEntries = ref<WebSocketConnectionLogEntry[]>([])

const pathParameters = ref({ ...props.parameters.path })
const queryParameters = ref({ ...props.parameters.query })
const connectionUrlOverride = ref<string | null>(null)
const selectedMessageName = ref(
  props.selectedMessage?.name ?? props.messages[0]?.name ?? null,
)
const outgoingPayload = ref(
  props.selectedMessage
    ? getMessagePayloadExample(props.selectedMessage.message)
    : '{}',
)

const canComposeMessage = true
const isConnected = computed(() => sessionState.value === 'open')

const environmentVariables = computed(() =>
  getEnvironmentVariables(props.environment),
)

const channelParameters = computed<ChannelParametersContext>(() => ({
  definitions: props.parameters.definitions,
  path: pathParameters.value,
  query: queryParameters.value,
}))

const resolvedConnectionUrl = computed(() => {
  if (connectionUrlOverride.value != null) {
    return connectionUrlOverride.value
  }

  const server = props.selectedServer?.server ?? props.servers[0]?.server
  if (!server) {
    return props.connectionUrl
  }

  return (
    props.selectedServer?.connectionUrl ??
    buildConnectionUrl({
      server,
      channel: props.channel,
      operation: null,
      pathParameters: pathParameters.value,
      queryParameters: queryParameters.value,
      environmentVariables: environmentVariables.value,
    })
  )
})

const authServer = computed((): ServerObject | null =>
  props.selectedServer
    ? {
        url: resolvedConnectionUrl.value,
        description: props.selectedServer.description,
      }
    : null,
)

const syncSessionState = (): void => {
  sessionState.value = wsSession.value.state
}

const addConnectionLogEntry = (
  status: WebSocketConnectionLogEntry['status'],
  message: string,
  detail?: string,
  details?: WebSocketConnectionLogEntry['details'],
): void => {
  connectionLogEntries.value.push({
    id: `${Date.now()}-${connectionLogEntries.value.length}`,
    type: 'connection',
    status,
    timestamp: Date.now(),
    message,
    detail,
    details,
  })
}

const handleConnect = async (): Promise<void> => {
  props.eventBus.flushDebouncedEmits?.()

  const missingPathParam = Object.entries(pathParameters.value).find(
    ([, value]) => !value?.trim(),
  )
  if (missingPathParam) {
    toast(`Path parameter "${missingPathParam[0]}" must have a value.`, 'error')
    connectionBarRef.value?.stopLoading()
    return
  }

  wsSession.value.destroy()
  wsSession.value = createWebSocketSession()
  syncSessionState()

  const result = await connectWebSocket({
    connectionUrl: resolvedConnectionUrl.value,
    session: wsSession.value,
    plugins: props.plugins,
    callbacks: {
      onFrame: (frame) => {
        messageFrames.value = [...messageFrames.value, frame]
        syncSessionState()
      },
      onStateChange: () => syncSessionState(),
      onOpen: () => {
        const connectionUrl = resolvedConnectionUrl.value
        addConnectionLogEntry(
          'connected',
          `Connected to ${connectionUrl}`,
          undefined,
          [
            { label: 'Request URL', value: connectionUrl },
            { label: 'Request Method', value: 'GET' },
            { label: 'Status Code', value: '101 Switching Protocols' },
            {
              label: 'Headers',
              value:
                'Browser WebSocket handshake headers are managed by the browser and are not exposed.',
            },
          ],
        )
        syncSessionState()
        connectionBarRef.value?.stopLoading()
      },
      onClose: (info) => {
        addConnectionLogEntry(
          'disconnected',
          'Disconnected',
          info.reason || `Code ${info.code}`,
          [
            { label: 'Close Code', value: String(info.code) },
            { label: 'Reason', value: info.reason || 'No reason provided' },
            { label: 'Clean Close', value: info.wasClean ? 'Yes' : 'No' },
          ],
        )
        syncSessionState()
      },
      onError: () => syncSessionState(),
    },
  })

  connectionBarRef.value?.stopLoading()

  if (!result.ok) {
    if (connectionLogEntries.value.length === 0) {
      addConnectionLogEntry(
        'error',
        'Connection failed',
        result.message ?? WEBSOCKET_CONNECTION_FAILED_MESSAGE,
        [
          {
            label: 'Error',
            value: result.message ?? WEBSOCKET_CONNECTION_FAILED_MESSAGE,
          },
        ],
      )
    }
    toast(result.message ?? WEBSOCKET_CONNECTION_FAILED_MESSAGE, 'error')
    syncSessionState()
  }
}

const handleDisconnect = (): void => {
  connectionBarRef.value?.stopLoading()
  wsSession.value.close()
  syncSessionState()
}

const handleSendMessage = (): void => {
  if (sessionState.value !== 'open') {
    toast('Connect before sending a message.', 'error')
    return
  }

  try {
    JSON.parse(outgoingPayload.value)
  } catch {
    toast('Message payload must be valid JSON.', 'error')
    return
  }

  wsSession.value.send(outgoingPayload.value)
  syncSessionState()
}

const handleClearMessages = (): void => {
  wsSession.value.clearFrames()
  messageFrames.value = []
  connectionLogEntries.value = []
  syncSessionState()
}

const handleCopyUrl = async (): Promise<void> => {
  await copyToClipboard(resolvedConnectionUrl.value)
}

const handleSelectServer = (serverName: string): void => {
  connectionUrlOverride.value = null
  props.workspaceStore.updateDocument(
    props.documentSlug,
    'x-scalar-selected-server',
    serverName,
  )
}

const handleConnectionUrlUpdate = (value: string): void => {
  connectionUrlOverride.value = value
}

const handlePathParameterUpdate = ({
  name,
  value,
}: {
  name: string
  value: string
}): void => {
  pathParameters.value[name] = value
}

const handleQueryParameterUpdate = ({
  name,
  value,
}: {
  name: string
  value: string
}): void => {
  queryParameters.value[name] = value
}

const handleSelectedMessageNameUpdate = (value: string): void => {
  selectedMessageName.value = value
}

const handleOutgoingPayloadUpdate = (value: string): void => {
  outgoingPayload.value = value
}

const resetChannelDraft = (): void => {
  pathParameters.value = { ...props.parameters.path }
  queryParameters.value = { ...props.parameters.query }
  connectionUrlOverride.value = null
  selectedMessageName.value =
    props.selectedMessage?.name ?? props.messages[0]?.name ?? null
  outgoingPayload.value = props.selectedMessage
    ? getMessagePayloadExample(props.selectedMessage.message)
    : '{}'
}

watch(
  () => props.selectedServer?.name,
  () => {
    connectionUrlOverride.value = null
  },
)

watch([() => props.channelName, () => props.parameters], () => {
  resetChannelDraft()
  handleDisconnect()
})

onBeforeUnmount(() => {
  wsSession.value.destroy()
})
</script>

<template>
  <div class="bg-b-1 flex h-full flex-col">
    <div
      class="lg:min-h-header t-app__top-container @container flex w-full flex-wrap items-center justify-center p-2">
      <div class="hidden flex-1 @3xl:flex"></div>
      <ConnectionBar
        ref="connectionBarRef"
        :connectionUrl="resolvedConnectionUrl"
        :environment="environment"
        :layout="layout"
        :selectedServer="selectedServer"
        :servers="servers"
        :sessionState="sessionState"
        @connect="handleConnect"
        @copy:url="handleCopyUrl"
        @disconnect="handleDisconnect"
        @select:server="handleSelectServer"
        @update:connectionUrl="handleConnectionUrlUpdate" />
      <div class="mb-2 hidden flex-1 @3xl:mb-0 @3xl:flex"></div>
    </div>

    <ViewLayout class="border-t">
      <ViewLayoutContent class="flex-1">
        <ChannelRequestBlock
          :authMeta="authMeta"
          :canSend="canComposeMessage"
          :channel="channel"
          :channelAddress="channelAddress"
          :channelName="channelName"
          :environment="environment"
          :eventBus="eventBus"
          :isConnected="isConnected"
          :layout="layout"
          :messages="messages"
          :operations="operations"
          :options="options"
          :outgoingPayload="outgoingPayload"
          :parameters="channelParameters"
          :plugins="plugins"
          proxyUrl=""
          :securityRequirements="securityRequirements"
          :securitySchemes="securitySchemes"
          :selectedMessageName="selectedMessageName"
          :selectedSecurity="selectedSecurity"
          :selectedSecuritySchemes="selectedSecuritySchemes"
          :server="authServer"
          @send:message="handleSendMessage"
          @update:outgoingPayload="handleOutgoingPayloadUpdate"
          @update:pathParameter="handlePathParameterUpdate"
          @update:queryParameter="handleQueryParameterUpdate"
          @update:selectedMessageName="handleSelectedMessageNameUpdate" />

        <ConnectionPanel
          :connectionLogEntries="connectionLogEntries"
          :frames="messageFrames"
          :sessionState="sessionState"
          @clear:messages="handleClearMessages" />
      </ViewLayoutContent>
    </ViewLayout>
  </div>
</template>
