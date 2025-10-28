<script setup lang="ts">
import { ScalarButton, ScalarSidebarItem } from '@scalar/components'
import { ScalarIconGlobe } from '@scalar/icons'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { capitalize, computed } from 'vue'

import Rabbit from '@/assets/rabbit.ascii?raw'
import RabbitJump from '@/assets/rabbitjump.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { Sidebar } from '@/v2/components/sidebar'
import type { ClientLayout } from '@/v2/types/layout'

const { documents, layout } = defineProps<{
  layout: ClientLayout
  documents: Record<string, WorkspaceDocument>
}>()

const emit = defineEmits<{
  (e: 'open:commandPalette', action?: 'import'): void
  (e: 'click:workspace'): void
}>()

/** Propogate up the workspace model to the parent */
const workspaceModel = defineModel<string>('workspace', {
  required: true,
  default: 'default',
})

// Temp until we have workspaces in the store
const workspaceLabel = computed(
  () => capitalize(workspaceModel.value) + ' Workspace',
)

/** Controls the visibility of the sidebar */
const isSidebarOpen = defineModel<boolean>('isSidebarOpen', {
  required: true,
})

/** Controls the width of the sidebar */
const sidebarWidth = defineModel<number>('sidebarWidth', {
  required: true,
  default: 288,
})

/** Calculate if we should show the getting started section */
const showGettingStarted = computed(() => true)
</script>

<template>
  <Sidebar
    v-model:isSidebarOpen="isSidebarOpen"
    v-model:sidebarWidth="sidebarWidth"
    v-model:workspace="workspaceModel"
    :documents="documents"
    :layout="layout">
    <!-- Workspace Identifier -->
    <template #workspaceButton>
      <ScalarSidebarItem
        is="button"
        :icon="ScalarIconGlobe"
        @click="emit('click:workspace')">
        {{ workspaceLabel }}
      </ScalarSidebarItem>
    </template>

    <!-- Getting started section -->
    <template
      v-if="layout !== 'modal'"
      #footer>
      <div
        :class="{
          'empty-sidebar-item border-t': showGettingStarted,
        }">
        <div
          v-if="showGettingStarted"
          class="empty-sidebar-item-content overflow-hidden px-2.5 py-2.5">
          <div class="rabbit-ascii relative m-auto mt-2 h-[68px] w-[60px]">
            <ScalarAsciiArt
              :art="Rabbit"
              class="rabbitsit font-bold" />
            <ScalarAsciiArt
              :art="RabbitJump"
              class="rabbitjump absolute top-0 left-0 font-bold" />
          </div>
          <div class="mt-2 mb-2 text-center text-sm text-balance">
            <b class="font-medium">Let's Get Started</b>
            <p class="mt-2 leading-3">
              Create request, folder, collection or import from OpenAPI/Postman
            </p>
          </div>
        </div>

        <div class="gap-1.5 p-2">
          <ScalarButton
            v-if="showGettingStarted"
            class="w-full"
            size="sm"
            @click="emit('open:commandPalette', 'import')">
            Import Collection
          </ScalarButton>

          <ScalarButton
            class="w-full"
            hotkey="K"
            size="sm"
            variant="outlined"
            @click="emit('open:commandPalette')">
            Add Item
          </ScalarButton>
        </div>
      </div>
    </template>
  </Sidebar>
</template>

<style scoped>
.empty-sidebar-item-content {
  display: none;
}
.empty-sidebar-item .empty-sidebar-item-content {
  display: block;
}
.rabbitjump {
  opacity: 0;
}
.empty-sidebar-item:hover .rabbitjump {
  opacity: 1;
  animation: rabbitAnimation 0.5s steps(1) infinite;
}
.empty-sidebar-item:hover .rabbitsit {
  opacity: 0;
  animation: rabbitAnimation2 0.5s steps(1) infinite;
}
.empty-sidebar-item:hover .rabbit-ascii {
  animation: rabbitRun 8s infinite linear;
}
@keyframes rabbitRun {
  0% {
    transform: translate3d(0, 0, 0);
  }
  25% {
    transform: translate3d(250px, 0, 0);
  }
  25.01% {
    transform: translate3d(-250px, 0, 0);
  }
  75% {
    transform: translate3d(250px, 0, 0);
  }
  75.01% {
    transform: translate3d(-250px, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}
@keyframes rabbitAnimation {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
@keyframes rabbitAnimation2 {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
    transform: translate3d(0, -8px, 0);
  }
}
</style>
