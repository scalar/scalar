<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'

import { OpenApiClientButton } from '@/components'
import type { ClientLayout } from '@/hooks'
import type { EnvVariable } from '@/store'
import type { createStoreEvents } from '@/store/events'
import { AddressBar, type History } from '@/v2/blocks/scalar-address-bar-block'

const { showSidebar = true, hideClientButton = false } = defineProps<{
  /** Current request path */
  path: string
  /** Current request method */
  method: HttpMethod
  /** Client layout */
  layout: ClientLayout

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
  /** Event bus */
  events: ReturnType<typeof createStoreEvents>

  eventBus: WorkspaceEventBus

  /** TODO: to be removed once we fully migrate to the new store */
  environment: Environment
  envVariables: EnvVariable[]
}>()

const emit = defineEmits<{
  (e: 'execute'): void
  (
    e: 'update:path',
    payload: {
      value: string
    },
  ): void
  (
    e: 'update:method',
    payload: {
      value: HttpMethod
    },
  ): void
}>()
</script>

<template>
  <div
    class="lg:min-h-header t-app__top-container flex w-full flex-wrap items-center justify-center border-b p-2 pt-2 lg:p-1 lg:pt-1">
    <div
      class="mb-2 flex w-1/2 flex-row items-center gap-1 lg:mb-0 lg:flex-1 lg:px-1">
      <!--
          Holds space for the sidebar toggle 

          Hidden for `modal` layout
      -->
      <div
        v-if="showSidebar"
        class="size-8"
        :class="{ hidden: layout === 'modal' && !isSidebarOpen }" />
    </div>
    <AddressBar
      @update:method="(payload) => emit('update:method', payload)"
      @update:path="(payload) => emit('update:path', payload)"
      :envVariables="envVariables"
      :environment="environment"
      :events="events"
      :history="history"
      :layout="layout"
      :method="method"
      :path="path"
      :percentage="requestLoadingPercentage"
      :server="server"
      :servers="servers"
      :eventBus="eventBus"
      @execute="emit('execute')" />
    <div
      class="mb-2 flex w-1/2 flex-row items-center justify-end gap-1 lg:mb-0 lg:flex-1 lg:px-2.5">
      <!-- 
          Open API Client Button

          Only shown in `modal` layout
      -->
      <OpenApiClientButton
        v-if="layout === 'modal' && documentUrl && !hideClientButton"
        buttonSource="modal"
        class="!w-fit lg:-mr-1"
        :integration="integration ?? null"
        :source="source ?? 'api-reference'"
        :url="documentUrl" />
      <!-- 
          Close Button

          Only shown in `modal` layout and hidden for GitBook Integration
      -->
      <button
        v-if="layout === 'modal'"
        class="app-exit-button gitbook-hidden zoomed:static zoomed:p-1 fixed top-2 right-2 rounded-full p-2"
        type="button"
        @click="eventBus.emit('hide:modal')">
        <ScalarIcon
          icon="Close"
          size="lg"
          thickness="2" />
        <span class="sr-only">Close Client</span>
      </button>
      <!-- 
          Close Button for GitBook Integration

          Hidden by default and visible for GitBook Integration in `modal` layout
      -->
      <button
        v-if="layout === 'modal'"
        class="text-c-1 hover:bg-b-2 active:text-c-1 gitbook-show -mr-1.5 rounded p-2"
        type="button"
        @click="eventBus.emit('hide:modal')">
        <ScalarIcon
          icon="Close"
          size="md"
          thickness="1.75" />
        <span class="sr-only">Close Client</span>
      </button>
    </div>
  </div>
</template>
<style scoped>
.gitbook-show {
  display: none;
}
.app-exit-button {
  color: white;
  background: rgba(0, 0, 0, 0.1);
}
.app-exit-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
