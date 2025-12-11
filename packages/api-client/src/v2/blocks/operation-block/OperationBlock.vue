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
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type {
  OpenApiDocument,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { onBeforeUnmount, onMounted } from 'vue'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import type { ClientLayout } from '@/hooks'
import { createStoreEvents } from '@/store/events'
import { buildRequest } from '@/v2/blocks/operation-block/helpers/build-request'
import { RequestBlock } from '@/v2/blocks/request-block'
import { ResponseBlock } from '@/v2/blocks/response-block'
import { type History } from '@/v2/blocks/scalar-address-bar-block'
import type { ClientPlugin } from '@/v2/plugins'

import Header from './components/Header.vue'

const {
  cookies = [],
  eventBus,
  path,
  method,
  exampleKey,
  operation,
  environment,
  server,
  proxyUrl,
  securitySchemes,
  selectedSecurity,
} = defineProps<{
  /** Workspace/document cookies */
  cookies: XScalarCookie[]
  /** Event bus */
  eventBus: WorkspaceEventBus
  /** Application version */
  appVersion: string
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
  /** Preprocessed response */
  response?: ResponseInstance
  /** Original request instance */
  request?: Request
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
  authMeta?: AuthMeta
  /** Document defined security schemes */
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  /** Currently selected security for the current operation */
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  /** Required security for the operation/document */
  security: OpenApiDocument['security']
  /** Client plugins */
  plugins?: ClientPlugin[]
  /** For environment variables in the inputs */
  environment: XScalarEnvironment
}>()

const emit = defineEmits<{
  /** Route to the appropriate server page */
  (e: 'update:servers'): void
}>()

/** Execute the current operation example */
const handleExecute = () => {
  buildRequest({
    cookies,
    environment,
    exampleKey,
    method,
    operation,
    path,
    securitySchemes,
    selectedSecurity,
    server,
    proxyUrl,
  })
  // eventBus.emit('operation:send:request', {
  //   meta: { path, method, exampleKey },
  // })
}

/** Handle the hotkey trigger to send the request */
onMounted(() => {
  eventBus.on('operation:send:request:hotkey', handleExecute)
})
onBeforeUnmount(() => {
  eventBus.off('operation:send:request:hotkey', handleExecute)
})
</script>
<template>
  <div class="bg-b-1 flex h-full flex-col">
    <div
      class="lg:min-h-header flex w-full flex-wrap items-center justify-center p-2 lg:p-1">
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

    <ViewLayout>
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
          :security
          :securitySchemes
          :selectedSecurity />

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
