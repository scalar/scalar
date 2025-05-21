<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type {
  Collection,
  Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { useRouter } from 'vue-router'

import { OpenApiClientButton } from '@/components'
import AddressBar from '@/components/AddressBar/AddressBar.vue'
import { useLayout } from '@/hooks/useLayout'
import { useSidebar } from '@/hooks/useSidebar'
import { useWorkspace } from '@/store'
import type { EnvVariable } from '@/store/active-entities'

const { collection, operation, server, environment, envVariables, workspace } =
  defineProps<{
    collection: Collection
    operation: Operation
    server: Server | undefined
    environment: Environment
    envVariables: EnvVariable[]
    workspace: Workspace
  }>()

defineEmits<{
  (e: 'hideModal'): void
  (e: 'importCurl', value: string): void
}>()

const { hideClientButton, showSidebar, integration } = useWorkspace()
const { isSidebarOpen } = useSidebar()

const { layout } = useLayout()
const { currentRoute } = useRouter()
</script>
<template>
  <div
    class="lg:min-h-header t-app__top-container flex w-full flex-wrap items-center justify-center border-b p-2 pt-2 lg:p-1 lg:pt-1">
    <div
      class="mb-2 flex w-1/2 flex-row items-center gap-1 lg:mb-0 lg:flex-1 lg:px-1">
      <!-- Holds space for the sidebar toggle -->
      <div
        v-if="showSidebar"
        class="size-8"
        :class="{ hidden: layout === 'modal' && !isSidebarOpen }" />
    </div>
    <!-- Address Bar - we should always have a collection and operation -->
    <AddressBar
      :collection="collection"
      :envVariables="envVariables"
      :environment="environment"
      :operation="operation"
      :server="server"
      :workspace="workspace"
      @importCurl="$emit('importCurl', $event)" />
    <div
      class="mb-2 flex w-1/2 flex-row items-center justify-end gap-1 lg:mb-0 lg:flex-1 lg:px-2.5">
      <OpenApiClientButton
        v-if="layout === 'modal' && collection.documentUrl && !hideClientButton"
        buttonSource="modal"
        class="!w-fit lg:-mr-1"
        :integration="integration ?? collection.integration ?? null"
        :source="
          currentRoute.query.source === 'gitbook' ? 'gitbook' : 'api-reference'
        "
        :url="collection.documentUrl" />
      <button
        v-if="layout === 'modal'"
        class="app-exit-button gitbook-hidden zoomed:static zoomed:p-1 fixed top-2 right-2 rounded-full p-2"
        type="button"
        @click="$emit('hideModal')">
        <ScalarIcon
          icon="Close"
          size="lg"
          thickness="2" />
        <span class="sr-only">Close Client</span>
      </button>
      <!-- TODO: temporary solution: 2nd button (not fixed position) for our friends at GitBook -->
      <button
        v-if="layout === 'modal'"
        class="text-c-1 hover:bg-b-2 active:text-c-1 gitbook-show -mr-1.5 rounded p-2"
        type="button"
        @click="$emit('hideModal')">
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
