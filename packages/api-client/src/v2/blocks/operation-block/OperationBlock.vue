<script lang="ts">
/**
 * OperationBlock
 *
 * Orchestrates the operation view by wiring together the Header, OperationBlock,
 * and ResponseBlock. Forwards user interactions to the workspace event bus and
 * passes through configuration such as auth, servers, plugins, and environment.
 * This component keeps the Operation page lean by centralizing event emission
 * and prop wiring between the blocks.
 *
 * Notable behavior:
 * - Uses operation['x-scalar-method'] and operation['x-scalar-path'] to provide
 *   draft overrides for the UI when present.
 */
export default {
  name: 'OperationBlock',
}
</script>
<script setup lang="ts">
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import {
  AVAILABLE_CLIENTS,
  type AvailableClients,
} from '@scalar/types/snippetz'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type { HistoryEntry } from '@scalar/workspace-store/entities/history/schema'
import type {
  AuthMeta,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OpenApiDocument,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import type { ClientLayout } from '@/hooks'
import { ERRORS } from '@/libs/errors'
import { buildRequest } from '@/v2/blocks/operation-block/helpers/build-request'
import { getSecuritySchemes } from '@/v2/blocks/operation-block/helpers/build-request-security'
import { harToFetchRequest } from '@/v2/blocks/operation-block/helpers/har-to-fetch-request'
import { harToFetchResponse } from '@/v2/blocks/operation-block/helpers/har-to-fetch-response'
import { sendRequest } from '@/v2/blocks/operation-block/helpers/send-request'
import { generateClientOptions } from '@/v2/blocks/operation-code-sample'
import { RequestBlock } from '@/v2/blocks/request-block'
import type { ExtendedScalarCookie } from '@/v2/blocks/request-block/RequestBlock.vue'
import { ResponseBlock } from '@/v2/blocks/response-block'
import { type History } from '@/v2/blocks/scalar-address-bar-block'
import type { MergedSecuritySchemes } from '@/v2/blocks/scalar-auth-selector-block/helpers/merge-security'
import {
  getSecurityRequirements,
  getSelectedSecurity,
} from '@/v2/features/operation'
import { type ClientPlugin } from '@/v2/helpers/plugins'

import Header from './components/Header.vue'

const {
  authMeta,
  environment,
  documentSecurity,
  documentSelectedSecurity,
  eventBus,
  exampleKey,
  globalCookies = [],
  hideClientButton,
  httpClients = AVAILABLE_CLIENTS,
  history = [],
  method,
  operation,
  operationSelectedSecurity,
  setOperationSecurity,
  path,
  plugins = [],
  proxyUrl,
  securitySchemes,
  selectedClient,
  server,
  environments,
  activeEnvironment,
} = defineProps<{
  /** Event bus */
  eventBus: WorkspaceEventBus
  /** Document defined security */
  documentSecurity: OpenApiDocument['security']
  /** Document selected security */
  documentSelectedSecurity: SelectedSecurity | undefined
  /** Application version */
  appVersion: string
  /** Workspace/document cookies */
  globalCookies: ExtendedScalarCookie[]
  /** Current request path */
  path: string
  /** Current request method */
  method: HttpMethodType
  /** HTTP clients */
  httpClients: AvailableClients
  /** The history for the operation */
  history?: HistoryEntry[]
  /** Client layout */
  layout: ClientLayout
  /** Currently selected server */
  server: ServerObject | null
  /** Currently selected client */
  selectedClient: WorkspaceStore['workspace']['x-scalar-default-client']
  /** Server list available for operation/document */
  servers: ServerObject[]
  /** Hides the client button on the header */
  hideClientButton?: boolean
  /** Client integration  */
  integration?: string | null
  /** Openapi document url for `modal` mode to open the client app */
  documentUrl?: string
  /** Client source */
  source?: 'gitbook' | 'api-reference'
  /** Operation object */
  operation: OperationObject
  /** Operation selected security */
  operationSelectedSecurity: SelectedSecurity | undefined
  /** Whether to set security at the operation level */
  setOperationSecurity: boolean
  /** Currently selected example key for the current operation */
  exampleKey: string
  /** Meta information for the auth update */
  authMeta: AuthMeta
  /** Document defined security schemes */
  securitySchemes: MergedSecuritySchemes
  /** Client plugins */
  plugins: ClientPlugin[]
  /** Environment list */
  environments?: string[]
  /** Currently selected environment */
  activeEnvironment?: string
  /** For environment variables in the inputs */
  environment: XScalarEnvironment
  /** The proxy URL for sending requests */
  proxyUrl: string
}>()

const emit = defineEmits<{
  /** Route to the appropriate server page */
  (e: 'update:servers'): void
}>()

/** Hoist up client generation so it doesn't get re-generated on every operation */
const clientOptions = computed(() => generateClientOptions(httpClients))

/** Compute what the security requirements should be for an operation */
const securityRequirements = computed(() =>
  getSecurityRequirements(documentSecurity, operation.security),
)

/** The selected security for the operation or document */
const selectedSecurity = computed(() =>
  getSelectedSecurity(
    documentSelectedSecurity,
    operationSelectedSecurity,
    securityRequirements.value,
    setOperationSecurity,
  ),
)

/** The above selected requirements in scheme form */
const selectedSecuritySchemes = computed(() =>
  getSecuritySchemes(securitySchemes, selectedSecurity.value.selectedSchemes),
)

const { toast } = useToasts()

// Refs
const abortController = ref<AbortController | null>(null)
const response = ref<ResponseInstance | null>(null)
const request = ref<Request | null>(null)

/** Cancel the request */
const cancelRequest = () => abortController.value?.abort(ERRORS.REQUEST_ABORTED)

/** Execute the current operation example */
const handleExecute = async () => {
  const [error, result] = buildRequest({
    environment,
    exampleKey,
    globalCookies,
    method,
    operation,
    path,
    selectedSecuritySchemes: selectedSecuritySchemes.value,
    server,
    proxyUrl,
  })

  // Toast the error
  if (error) {
    toast(error.message, 'error')
    return
  }

  // Store the abort controller for cancellation
  abortController.value = result.controller

  // Stop any previous streaming response
  if (response.value && 'reader' in response.value) {
    response.value.reader.cancel()
  }

  // Execute the hooks
  eventBus.emit('hooks:on:request:sent', {
    meta: {
      method,
      path,
      exampleKey,
    },
  })

  /** Execute the request */
  const [sendError, sendResult] = await sendRequest({
    isUsingProxy: result.isUsingProxy,
    operation,
    plugins,
    request: result.request,
  })

  // Execute the hooks
  eventBus.emit('hooks:on:request:complete', {
    payload: sendResult
      ? {
          response: sendResult.originalResponse,
          request: sendResult.request.clone(),
          duration: sendResult.response.duration,
          timestamp: sendResult.timestamp,
        }
      : undefined,
    meta: {
      method,
      path,
      exampleKey,
    },
  })

  // Toast the execute error
  if (sendError) {
    toast(sendError.message, 'error')
    return
  }

  // Store the response
  response.value = sendResult.response
  request.value = sendResult.request
}

onMounted(() => {
  eventBus.on('operation:send:request:hotkey', handleExecute)
  eventBus.on('operation:cancel:request', cancelRequest)
})
onBeforeUnmount(() => {
  eventBus.off('operation:send:request:hotkey', handleExecute)
  eventBus.off('operation:cancel:request', cancelRequest)
})

const operationHistory = computed<History[]>(() =>
  history
    .map((entry) => ({
      method: entry.request.method as HttpMethodType,
      path: entry.request.url,
      duration: entry.time,
      status: entry.response.status,
    }))
    .reverse(),
)

const handleSelectHistoryItem = ({ index }: { index: number }) => {
  const transformedIndex = (history.length ?? 0) - index - 1
  const historyItem = history[transformedIndex]
  if (!historyItem) {
    return
  }

  const navigate = () =>
    eventBus.emit('ui:route:example', {
      exampleName: 'draft',
      callback: async () => {
        // Reconstruct the response
        const fetchResponse = harToFetchResponse({
          harResponse: historyItem.response,
          url: historyItem.request.url,
          method,
          path,
          duration: historyItem.time,
        })

        // Reconstruct the request
        const fetchRequest = harToFetchRequest({
          harRequest: historyItem.request,
        })

        // Update the response and request
        response.value = fetchResponse
        request.value = fetchRequest
      },
    })

  eventBus.emit('operation:reload:history', {
    meta: {
      path,
      method,
    },
    index: transformedIndex,
    callback: navigate,
  })
}

/**
 * When the path, method, or example key changes, clear the response and request
 */
watch([() => path, () => method, () => exampleKey], () => {
  // We reset the response and request
  response.value = null
  request.value = null

  // We cancel the request if it is still in progress
  cancelRequest()
})

onBeforeUnmount(() => {
  // We cancel the request if the component is unmounted
  cancelRequest()
})
</script>
<template>
  <div class="bg-b-1 flex h-full flex-col">
    <div
      class="lg:min-h-header flex w-full flex-wrap items-center justify-center p-2 lg:p-0">
      <!-- Address Bar -->
      <Header
        :activeEnvironment
        :documentUrl
        :environment
        :environments
        :eventBus
        :hideClientButton
        :history="operationHistory"
        :integration
        :layout
        :method
        :path
        :server
        :servers
        :source
        @execute="handleExecute"
        @select:history:item="handleSelectHistoryItem"
        @update:servers="emit('update:servers')" />
    </div>

    <ViewLayout class="border-t">
      <ViewLayoutContent class="flex-1">
        <!-- Request Section -->
        <RequestBlock
          :authMeta
          :clientOptions
          :environment
          :eventBus
          :exampleKey
          :globalCookies
          :layout
          :method
          :operation
          :path
          :plugins
          :proxyUrl
          :securityRequirements
          :securitySchemes
          :selectedClient
          :selectedSecurity
          :selectedSecuritySchemes
          :server />

        <!-- Response Section -->
        <ResponseBlock
          :appVersion
          :eventBus
          :layout
          :plugins
          :request
          :response
          :totalPerformedRequests="operationHistory.length" />
      </ViewLayoutContent>
    </ViewLayout>
  </div>
</template>
