<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { OpenApiClientButton } from '@/components'
import type { ClientLayout } from '@/hooks'
import { AddressBar, type History } from '@/v2/blocks/scalar-address-bar-block'
import EnvironmentSelector from '@/v2/blocks/scalar-address-bar-block/components/EnvironmentSelector.vue'

const { hideClientButton = false, eventBus } = defineProps<{
  /** Current request path */
  path: string
  /** Current request method */
  method: HttpMethod
  /** Client layout */
  layout: ClientLayout
  /** Hides the client button on the header */
  hideClientButton?: boolean
  /** Client integration  */
  integration?: string | null
  /** Openapi document url for `modal` mode to open the client app */
  documentUrl?: string
  /** Client source */
  source?: 'gitbook' | 'api-reference'
  /** Currently selected server */
  server: ServerObject | null
  /** Server list available for operation/document */
  servers: ServerObject[]
  /** List of request history */
  history: History[]
  /** Event bus */
  eventBus: WorkspaceEventBus
  /** Environment list */
  environments?: string[]
  /** Currently selected environment */
  activeEnvironment?: string
  /** Environment variables */
  environment: XScalarEnvironment
}>()

const emit = defineEmits<{
  (e: 'execute'): void
  (e: 'update:servers'): void
  /** Select a request history item by index */
  (e: 'select:history:item', payload: { index: number }): void
  /** Add a new environment */
  (e: 'add:environment'): void
}>()

const handleSelectEnvironment = (environmentName: string) => {
  eventBus.emit('workspace:update:active-environment', environmentName)
}

const handleAddEnvironment = () => {
  eventBus.emit('ui:route:page', { name: 'workspace.environment' })
}
</script>

<template>
  <div
    class="lg:min-h-header t-app__top-container flex w-full flex-wrap items-center justify-center p-2 pt-2 lg:p-1 lg:pt-1">
    <div
      class="mb-2 flex w-1/2 flex-row items-center gap-1 lg:mb-0 lg:flex-1 lg:px-1">
      <!--
          Holds space for the sidebar toggle

          Hidden for `modal` layout
      -->
      <div class="size-8"></div>
    </div>
    <AddressBar
      :activeEnvironment
      :environment
      :environments
      :eventBus
      :history
      :layout
      :method
      :path
      :server
      :servers
      @add:environment="emit('add:environment')"
      @execute="emit('execute')"
      @select:history:item="(payload) => emit('select:history:item', payload)"
      @update:servers="emit('update:servers')" />

    <div
      class="mb-2 flex w-1/2 flex-row items-center justify-end gap-2 lg:mb-0 lg:flex-1 lg:px-2.5">
      <!--
        Environment Selector
        Hidden for `modal` layout
      -->
      <EnvironmentSelector
        v-if="layout !== 'modal'"
        :activeEnvironment="activeEnvironment"
        :environments="environments"
        @add:environment="handleAddEnvironment"
        @select:environment="handleSelectEnvironment" />
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
        v-if="layout === 'modal' && source !== 'gitbook'"
        class="app-exit-button zoomed:static zoomed:p-1 fixed top-2 right-2 rounded-full p-2"
        type="button"
        @click="eventBus.emit('ui:close:client-modal')">
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
        v-if="layout === 'modal' && source === 'gitbook'"
        class="text-c-1 hover:bg-b-2 active:text-c-1 -mr-1.5 rounded p-2"
        type="button"
        @click="eventBus.emit('ui:close:client-modal')">
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
.app-exit-button {
  color: white;
  background: rgba(0, 0, 0, 0.1);
}
.app-exit-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
