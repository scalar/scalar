<script setup lang="ts">
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
import { type createStoreEvents } from '@/store/events'
import { RequestBlock } from '@/v2/blocks/request-block'
import { ResponseBlock } from '@/v2/blocks/response-block'
import { type History } from '@/v2/blocks/scalar-address-bar-block'
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
  server: ServerObject | undefined
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
  /** Event bus */
  events: ReturnType<typeof createStoreEvents>

  plugins?: ClientPlugin[]
  /** For environment variables in the inputs */
  environment: XScalarEnvironment
}>()

const draftMethod = computed(
  () => (operation['x-scalar-method'] as HttpMethodType) ?? method,
)
const draftPath = computed(() => operation['x-scalar-path'] ?? path)

const handleExecute = () =>
  eventBus.emit('operation:send:request', {
    meta: { path, method, exampleKey },
  })

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
</script>
<template>
  <div class="bg-b-1 flex h-full flex-col">
    <div
      class="lg:min-h-header flex w-full flex-wrap items-center justify-center p-2 lg:p-1">
      <Header
        :documentUrl="documentUrl"
        :environment="environment"
        :eventBus="eventBus"
        :events="events"
        :hideClientButton="hideClientButton"
        :history="history"
        :integration="integration"
        :isSidebarOpen="isSidebarOpen"
        :layout="layout"
        :method="draftMethod"
        :path="draftPath"
        :percentage="requestLoadingPercentage"
        :server="server"
        :servers="servers"
        :showSidebar="showSidebar"
        :source="source"
        @execute="handleExecute"
        @update:method="handleUpdateMethod"
        @update:path="handleUpdatePath" />
    </div>

    <ViewLayout>
      <ViewLayoutContent class="flex flex-1">
        <RequestBlock
          :authMeta="authMeta"
          :environment="environment"
          :eventBus="eventBus"
          :exampleKey="exampleKey"
          :layout="layout"
          :method="method"
          :operation="operation"
          :path="path"
          :plugins="plugins"
          :security="security"
          :securitySchemes="securitySchemes"
          :selectedSecurity="selectedSecurity" />

        <ResponseBlock
          :appVersion="appVersion"
          :eventBus="eventBus"
          :events="events"
          :layout="layout"
          :plugins="plugins"
          :request="request"
          :response="response"
          :totalPerformedRequests="totalPerformedRequests"
          @sendRequest="
            eventBus.emit('operation:send:request', {
              meta: { path, method, exampleKey },
            })
          " />
      </ViewLayoutContent>
    </ViewLayout>
  </div>
</template>
