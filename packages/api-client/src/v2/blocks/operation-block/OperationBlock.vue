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
import type { ScalarButton } from '@scalar/components'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { computed } from 'vue'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import type { ClientLayout } from '@/hooks'
import { createStoreEvents } from '@/store/events'
import { RequestBlock } from '@/v2/blocks/request-block'
import { ResponseBlock } from '@/v2/blocks/response-block'
import { type History } from '@/v2/blocks/scalar-address-bar-block'
import type { CodeInput } from '@/v2/components/code-input'
import type { ClientPlugin } from '@/v2/plugins'

import Header from './components/Header.vue'

const { eventBus, path, method, exampleKey, operation } = defineProps<{
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
  /**
   * When the request is sent from the modal, this indicates the progress percentage
   * of the request being sent.
   *
   * The amount remaining to load from 100 -> 0
   */
  requestLoadingPercentage?: number
  /** Preprocessed response */
  response?: ResponseInstance
  /** Original request instance */
  request?: Request
  /** Total number of performed requests */
  totalPerformedRequests: number
  /** Sidebar open state */
  isSidebarOpen?: boolean
  /** Controls sidebar visibility */
  showSidebar?: boolean
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

/**
 * We use a draft method and path to allow the user to explicitly save the method or path changes
 * as it re-calculates the sidebar and we need to ensure they don't conflict
 */
const draftMethod = computed(() => operation['x-scalar-method'] ?? method)
const draftPath = computed(() => operation['x-scalar-path'] ?? path)

/** Execute the current operation example */
const handleExecute = () =>
  eventBus.emit('operation:send:request', {
    meta: { path, method, exampleKey },
  })

/** Update the HTTP method for the operation in its draft state */
const handleUpdateMethod = (payload: { value: HttpMethodType }) =>
  eventBus.emit('operation:update:method', {
    meta: {
      method,
      path,
    },
    payload: {
      method: payload.value,
    },
  })

/** Update the path for the operation in its draft state */
const handleUpdatePath = (payload: { value: string }) =>
  eventBus.emit('operation:update:path', {
    meta: {
      method,
      path,
    },
    payload: {
      path: payload.value,
    },
  })

/** We want to drill down these refs so we can focus them via hotkeys */
const addressBarRef = defineModel<typeof CodeInput | null>('addressBarRef')
const sendButtonRef = defineModel<typeof ScalarButton | null>('sendButtonRef')
</script>
<template>
  <div class="bg-b-1 flex h-full flex-col">
    <div
      class="lg:min-h-header flex w-full flex-wrap items-center justify-center p-2 lg:p-1">
      <!-- Address Bar -->
      <Header
        :addressBarRef
        :documentUrl
        :environment
        :eventBus
        :hideClientButton
        :history
        :integration
        :isSidebarOpen
        :layout
        :method="draftMethod"
        :path="draftPath"
        :percentage="requestLoadingPercentage"
        :sendButtonRef
        :server
        :servers
        :showSidebar
        :source
        @execute="handleExecute"
        @update:method="handleUpdateMethod"
        @update:path="handleUpdatePath"
        @update:servers="emit('update:servers')" />
    </div>

    <ViewLayout>
      <ViewLayoutContent class="flex flex-1">
        <!-- Request Section -->
        <RequestBlock
          :authMeta
          :environment
          :eventBus
          :exampleKey
          :layout
          :method="draftMethod"
          :operation
          :path="draftPath"
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
