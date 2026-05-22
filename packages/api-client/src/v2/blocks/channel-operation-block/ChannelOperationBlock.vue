<script lang="ts">
/**
 * ChannelOperationBlock orchestrates the AsyncAPI channel operation view:
 * connection bar, request parameters, auth, message editor, and live message log.
 */
export default {
  name: 'ChannelOperationBlock',
}

export type ChannelOperationBlockProps = {
  eventBus: WorkspaceEventBus
  documentSlug: string
  layout: ClientLayout
  workspaceStore: WorkspaceStore
  operationName: string
  operation: AsyncApiOperationObject
  channel: AsyncApiChannelObject
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
import type {
  AsyncApiChannelObject,
  AsyncApiOperationObject,
} from '@scalar/types/asyncapi/3.1'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { useToasts } from '@scalar/use-toasts'
import {
  buildConnectionUrl,
  type AsyncApiServerEntry,
  type ChannelMessageEntry,
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
import { computed, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import {
  connectWebSocket,
  createWebSocketSession,
  WEBSOCKET_CONNECTION_FAILED_MESSAGE,
} from '@/v2/blocks/channel-operation-block'
import { getMessagePayloadExample } from '@/v2/blocks/channel-operation-block/helpers/get-message-payload-example'
import type { WebSocketFrame } from '@/v2/blocks/channel-operation-block/helpers/websocket-session'
import type { ClientLayout } from '@/v2/types/layout'
import type { ApiClientOptions } from '@/v2/types/options'

import ChannelRequestBlock from './components/ChannelRequestBlock.vue'
import ConnectionBar from './components/ConnectionBar.vue'
import ConnectionPanel from './components/ConnectionPanel.vue'

const {
  authMeta,
  channel,
  connectionUrl: initialConnectionUrl,
  documentSlug,
  workspaceStore,
  environment,
  eventBus,
  layout,
  messages,
  operation,
  operationName,
  options,
  parameters,
  plugins,
  selectedMessage,
  selectedSecurity,
  selectedSecuritySchemes,
  securityRequirements,
  securitySchemes,
  selectedServer,
  servers,
} = defineProps<ChannelOperationBlockProps>()

const { toast } = useToasts()
const { copyToClipboard } = useClipboard()

const connectionBarRef = useTemplateRef('connectionBarRef')
const wsSession = shallowRef(createWebSocketSession())
const sessionState = ref(wsSession.value.state)
const messageFrames = ref<WebSocketFrame[]>([])

const pathParameters = ref({ ...parameters.path })
const queryParameters = ref({ ...parameters.query })
const connectionUrlOverride = ref<string | null>(null)
const selectedMessageName = ref(
  selectedMessage?.name ?? messages[0]?.name ?? null,
)
const outgoingPayload = ref(
  selectedMessage ? getMessagePayloadExample(selectedMessage.message) : '{}',
)

const operationAction = computed(() => operation.action ?? 'receive')
/** Show the message editor when the operation sends, or when outbound messages exist on the channel. */
const canSend = computed(() => operationAction.value === 'send' || messages.length > 0)

const environmentVariables = computed(() =>
  getEnvironmentVariables(environment),
)

const resolvedConnectionUrl = computed(() => {
  if (connectionUrlOverride.value != null) {
    return connectionUrlOverride.value
  }

  const server = selectedServer?.server ?? servers[0]?.server
  if (!server) {
    return initialConnectionUrl
  }

  return (
    selectedServer?.connectionUrl ??
    buildConnectionUrl({
      server,
      channel,
      operation,
      pathParameters: pathParameters.value,
      queryParameters: queryParameters.value,
      environmentVariables: environmentVariables.value,
    })
  )
})

const authServer = computed((): ServerObject | null =>
  selectedServer
    ? {
        url: resolvedConnectionUrl.value,
        description: selectedServer.description,
      }
    : null,
)

const syncSessionState = (): void => {
  sessionState.value = wsSession.value.state
  messageFrames.value = [...wsSession.value.frames]
}

const handleConnect = async (): Promise<void> => {
  eventBus.flushDebouncedEmits?.()

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
    plugins,
    callbacks: {
      onFrame: () => syncSessionState(),
      onStateChange: () => syncSessionState(),
      onOpen: () => {
        syncSessionState()
        connectionBarRef.value?.stopLoading()
      },
      onClose: () => syncSessionState(),
      onError: () => syncSessionState(),
    },
  })

  connectionBarRef.value?.stopLoading()

  if (!result.ok) {
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
  syncSessionState()
}

const handleCopyUrl = async (): Promise<void> => {
  await copyToClipboard(resolvedConnectionUrl.value)
}

const handleSelectServer = (serverName: string): void => {
  workspaceStore.updateDocument(
    documentSlug,
    'x-scalar-selected-server',
    serverName,
  )
}

watch([() => operationName, () => parameters], () => {
  pathParameters.value = { ...parameters.path }
  queryParameters.value = { ...parameters.query }
  connectionUrlOverride.value = null
  selectedMessageName.value = selectedMessage?.name ?? messages[0]?.name ?? null
  outgoingPayload.value = selectedMessage
    ? getMessagePayloadExample(selectedMessage.message)
    : '{}'
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
        :action="operationAction"
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
        @update:connectionUrl="(value) => (connectionUrlOverride = value)" />
      <div class="mb-2 hidden flex-1 @3xl:mb-0 @3xl:flex"></div>
    </div>

    <ViewLayout class="border-t">
      <ViewLayoutContent class="flex-1">
        <ChannelRequestBlock
          :authMeta="authMeta"
          :canSend="canSend"
          :environment="environment"
          :eventBus="eventBus"
          :isConnected="sessionState === 'open'"
          :layout="layout"
          :messages="messages"
          :operation="operation"
          :operationName="operationName"
          :options="options"
          :outgoingPayload="outgoingPayload"
          :parameters="{
            definitions: parameters.definitions,
            path: pathParameters,
            query: queryParameters,
          }"
          :plugins="plugins"
          proxyUrl=""
          :securityRequirements="securityRequirements"
          :securitySchemes="securitySchemes"
          :selectedMessageName="selectedMessageName"
          :selectedSecurity="selectedSecurity"
          :selectedSecuritySchemes="selectedSecuritySchemes"
          :server="authServer"
          @send:message="handleSendMessage"
          @update:outgoingPayload="(value) => (outgoingPayload = value)"
          @update:pathParameter="
            ({ name, value }) => {
              pathParameters[name] = value
            }
          "
          @update:queryParameter="
            ({ name, value }) => {
              queryParameters[name] = value
            }
          "
          @update:selectedMessageName="
            (value) => (selectedMessageName = value)
          " />

        <ConnectionPanel
          :closeInfo="wsSession.closeInfo"
          :frames="messageFrames"
          :sessionState="sessionState"
          @clear:messages="handleClearMessages" />
      </ViewLayoutContent>
    </ViewLayout>
  </div>
</template>
