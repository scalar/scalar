<script setup lang="ts">
import type { SelectedSecuritySchemeUids } from '@scalar/oas-utils/entities/shared'
import { computed } from 'vue'

import EmptyState from '@/components/EmptyState.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useLayout } from '@/hooks'
import { useSidebar } from '@/hooks/useSidebar'
import { importCurlCommand } from '@/libs/importers/curl'
import type { SendRequestResult } from '@/libs/send-request/create-request-operation'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import RequestSection from '@/views/Request/RequestSection/RequestSection.vue'
import RequestSubpageHeader from '@/views/Request/RequestSubpageHeader.vue'
import ResponseSection from '@/views/Request/ResponseSection/ResponseSection.vue'

const { invalidParams, selectedSecuritySchemeUids, requestResult } =
  defineProps<{
    invalidParams: Set<string>
    selectedSecuritySchemeUids: SelectedSecuritySchemeUids
    requestResult?: SendRequestResult | null
  }>()
defineEmits<(e: 'newTab', item: { name: string; uid: string }) => void>()

const { events } = useWorkspace()
const { isSidebarOpen } = useSidebar()
const workspaceContext = useWorkspace()
const { layout } = useLayout()

const {
  activeCollection,
  activeExample,
  activeRequest,
  activeWorkspace,
  activeServer,
  activeEnvVariables,
  activeEnvironment,
  activeWorkspaceRequests,
} = useActiveEntities()
const { modalState, requestHistory } = workspaceContext

const activeHistoryEntry = computed(() =>
  [...requestHistory]
    .reverse()
    .find((r) => r.request.uid === activeExample.value?.uid),
)

function handleCurlImport(curl: string) {
  events.commandPalette.emit({
    commandName: 'Import from cURL',
    metaData: {
      parsedCurl: importCurlCommand(curl),
      collectionUid: activeCollection.value?.uid,
    },
  })
}
</script>

<template>
  <div
    v-if="activeCollection && activeWorkspace"
    class="bg-b-1 relative z-0 flex h-full flex-1 flex-col overflow-hidden pt-0"
    :class="{
      '!mr-0 !mb-0 !border-0': layout === 'modal',
    }">
    <div class="flex h-full">
      <!-- Ensure we have a request for this view -->
      <div
        v-if="activeRequest"
        class="flex h-full flex-1 flex-col">
        <RequestSubpageHeader
          v-model="isSidebarOpen"
          :collection="activeCollection"
          :envVariables="activeEnvVariables"
          :environment="activeEnvironment"
          :operation="activeRequest"
          :server="activeServer"
          :workspace="activeWorkspace"
          @hideModal="() => modalState.hide()"
          @importCurl="handleCurlImport" />
        <ViewLayout>
          <!-- TODO possible loading state -->
          <ViewLayoutContent
            v-if="activeExample"
            class="flex-1"
            :class="[isSidebarOpen ? 'sidebar-active-hide-layout' : '']">
            <RequestSection
              :collection="activeCollection"
              :envVariables="activeEnvVariables"
              :environment="activeEnvironment"
              :example="activeExample"
              :invalidParams="invalidParams"
              :operation="activeRequest"
              :selectedSecuritySchemeUids="selectedSecuritySchemeUids"
              :server="activeServer"
              :workspace="activeWorkspace" />
            <ResponseSection
              :collection="activeCollection"
              :operation="activeRequest"
              :workspace="activeWorkspace"
              :requestResult="requestResult"
              :numWorkspaceRequests="activeWorkspaceRequests.length"
              :response="activeHistoryEntry?.response" />
          </ViewLayoutContent>
        </ViewLayout>
      </div>

      <!-- No active request -->
      <EmptyState v-else />
    </div>
  </div>

  <!-- No Collection or Workspace -->
  <EmptyState v-else />
</template>

<style scoped>
.request-text-color-text {
  color: var(--scalar-color-1);
  background: linear-gradient(
    var(--scalar-background-1),
    var(--scalar-background-3)
  );
  box-shadow: 0 0 0 1px var(--scalar-border-color);
}
@media screen and (max-width: 800px) {
  .sidebar-active-hide-layout {
    display: none;
  }
  .sidebar-active-width {
    width: 100%;
  }
}
</style>
