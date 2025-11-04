<script setup lang="ts">
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { computed } from 'vue'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import type { ClientLayout } from '@/hooks'
import type { EnvVariable } from '@/store'
import { createStoreEvents } from '@/store/events'
import { type History } from '@/v2/blocks/scalar-address-bar-block'
import { OperationBlock } from '@/v2/blocks/scalar-operation-block'
import { ResponseBlock } from '@/v2/blocks/scalar-response-block'
import type { ClientPlugin } from '@/v2/plugins'

import Header from './Header.vue'

const props = defineProps<{
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
  /** Currently selected content type for the current operation example */
  selectedContentType?: string

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

  /** TODO: to be removed once we fully migrate to the new store */
  environment: Environment
  envVariables: EnvVariable[]
}>()

const draftMethod = computed(
  () => (props.operation['x-scalar-method'] as HttpMethodType) ?? props.method,
)
const draftPath = computed(() => props.operation['x-scalar-path'] ?? props.path)
</script>
<template>
  <div class="bg-b-1 flex h-full flex-col">
    <div
      class="lg:min-h-header flex w-full flex-wrap items-center justify-center p-2 lg:p-1">
      <Header
        :envVariables="envVariables"
        :environment="environment"
        :events="events"
        :history="history"
        :layout="layout"
        :method="draftMethod"
        :path="draftPath"
        :percentage="requestLoadingPercentage"
        :server="server"
        :servers="servers"
        :isSidebarOpen="isSidebarOpen"
        :showSidebar="showSidebar"
        :hideClientButton="hideClientButton"
        :integration="integration"
        :documentUrl="documentUrl"
        :source="source"
        :eventBus="eventBus"
        @execute="
          () =>
            eventBus.emit('operation:send:request', {
              meta: { path, method, exampleKey },
            })
        "
        @update:method="
          (payload) =>
            eventBus.emit('operation:update:method', {
              meta: {
                method,
                path,
              },
              method: payload.value,
            })
        "
        @update:path="
          (payload) =>
            eventBus.emit('operation:update:path', {
              meta: {
                method,
                path,
              },
              path: payload.value,
            })
        " />
    </div>
    <ViewLayout>
      <ViewLayoutContent class="flex flex-1">
        <OperationBlock
          :envVariables="envVariables"
          :environment="environment"
          :exampleKey="exampleKey"
          :layout="layout"
          :method="method"
          :operation="operation"
          :path="path"
          :authMeta="authMeta"
          :security="security"
          :eventBus="eventBus"
          :securitySchemes="securitySchemes"
          :selectedContentType="selectedContentType"
          :selectedSecurity="selectedSecurity"
          :plugins="plugins" />
        <ResponseBlock
          :appVersion="appVersion"
          :events="events"
          :layout="layout"
          :request="request"
          :response="response"
          :plugins="plugins"
          :eventBus="eventBus"
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
