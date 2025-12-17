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
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type {
  OpenApiDocument,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import type { ClientLayout } from '@/hooks'
import { ERRORS } from '@/libs/errors'
import { createStoreEvents } from '@/store/events'
import { buildRequest } from '@/v2/blocks/operation-block/helpers/build-request'
import { sendRequest } from '@/v2/blocks/operation-block/helpers/send-request'
import { RequestBlock } from '@/v2/blocks/request-block'
import { ResponseBlock } from '@/v2/blocks/response-block'
import { type History } from '@/v2/blocks/scalar-address-bar-block'
import { type ClientPlugin } from '@/v2/helpers/plugins'

import Header from './components/Header.vue'

const {
  authMeta,
  environment,
  eventBus,
  exampleKey,
  globalCookies = [],
  method,
  operation,
  path,
  plugins = [],
  proxyUrl,
  securitySchemes,
  selectedSecurity,
  server,
} = defineProps<{
  /** Event bus */
  eventBus: WorkspaceEventBus
  /** Application version */
  appVersion: string
  /** Workspace/document cookies */
  globalCookies: XScalarCookie[]
  /** Current request path */
  path: string
  /** Current request method */
  method: HttpMethodType
  /** Client layout */
  layout: ClientLayout
  /** Currently selected server */
  server: ServerObject | null
  /** Server list available for operation/document */
  servers: ServerObject[]
  /** List of request history */
  history: History[]
  /** Total number of performed requests */
  totalPerformedRequests: number
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
  /** Currently selected example key for the current operation */
  exampleKey: string
  /** Meta information for the auth update */
  authMeta: AuthMeta
  /** Document defined security schemes */
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  /** Currently selected security for the current operation */
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  /** Required security for the operation/document */
  security: OpenApiDocument['security']
  /** Client plugins */
  plugins: ClientPlugin[]
  /** For environment variables in the inputs */
  environment: XScalarEnvironment
  /** The proxy URL for sending requests */
  proxyUrl: string
}>()

const emit = defineEmits<{
  /** Route to the appropriate server page */
  (e: 'update:servers'): void
}>()

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
    securitySchemes,
    selectedSecurity: selectedSecurity?.selectedSchemes ?? [],
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

  // Start the animation
  eventBus.emit('hooks:on:request:sent')

  /** Execute the request */
  const [sendError, sendResult] = await sendRequest({
    isUsingProxy: result.isUsingProxy,
    operation,
    plugins,
    request: result.request,
  })

  // Stop the animation
  eventBus.emit('hooks:on:request:complete')

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

/**
 * When the path, method, or example key changes, clear the response and request
 * TODO: maybe in the future this will be hooked into the history api but for now we'll just clear the response and request
 */
watch([() => path, () => method, () => exampleKey], () => {
  response.value = null
  request.value = null
})
</script>
<template>
  <div class="bg-b-1 flex h-full flex-col">
    <div
      class="lg:min-h-header flex w-full flex-wrap items-center justify-center p-2 lg:p-0">
      <!-- Address Bar -->
      <Header
        :documentUrl
        :environment
        :eventBus
        :hideClientButton
        :history
        :integration
        :layout
        :method
        :path
        :server
        :servers
        :source
        @execute="handleExecute"
        @update:servers="emit('update:servers')" />
    </div>

    <ViewLayout class="border-t">
      <ViewLayoutContent class="flex-1">
        <!-- Request Section -->
        <RequestBlock
          :authMeta
          :environment
          :eventBus
          :exampleKey
          :layout
          :method
          :operation
          :path
          :plugins
          :proxyUrl
          :security
          :securitySchemes
          :selectedSecurity
          :server />

        <!-- Response Section -->
        <ResponseBlock
          :appVersion
          :eventBus
          :events="createStoreEvents()"
          :layout
          :plugins
          :request
          :response
          :totalPerformedRequests
          @sendRequest="handleExecute" />
      </ViewLayoutContent>
    </ViewLayout>
  </div>
</template>
