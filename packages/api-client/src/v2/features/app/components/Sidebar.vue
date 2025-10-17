<script setup lang="ts">
import {
  ScalarButton,
  ScalarIconButton,
  ScalarMenu,
  ScalarMenuResources,
  ScalarMenuSupport,
  ScalarSidebarSearchInput,
} from '@scalar/components'
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import {
  createSidebarState,
  ScalarSidebar,
  type DocumentItem,
  type Item,
  type WorkspaceItem,
} from '@scalar/sidebar'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { capitalize, computed, ref } from 'vue'

import Rabbit from '@/assets/rabbit.ascii?raw'
import RabbitJump from '@/assets/rabbitjump.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import type { ClientLayout } from '@/v2/types/layout'

import SidebarMenuWorkspace from './SidebarMenuWorkspace.vue'

const { documents, layout } = defineProps<{
  layout: ClientLayout
  documents: Record<string, WorkspaceDocument>
}>()

const emit = defineEmits<{
  (e: 'openCommandPalette', action?: 'import'): void
}>()

// Temp until we have workspaces in the store
const workspaceModel = ref('default')

// Temp until we have workspaces in the store
const workspaceLabel = capitalize(workspaceModel.value) + ' Workspace'

/** Generate the sidebar state based on the current workspace */
const sidebarState = computed(() => {
  const documentEntries: Item[] = Object.entries(documents).map(
    ([name, doc]) => ({
      id: name,
      type: 'document',
      title: doc.info.title ?? name,
      children: doc['x-scalar-navigation'] ?? [],
    }),
  )

  const state = createSidebarState(documentEntries)

  /**
   * Traverses down the children to open the first leaf
   */
  const openLeaf = (child: Item | undefined) => {
    if (!child) {
      return
    }

    if (child.type === 'text') {
      openLeaf(child.children?.[0])
    }

    if ('children' in child && child.children && child.children.length > 0) {
      openLeaf(child.children[0])
    } else {
      state.setExpanded(child.id, true)
    }
  }
  openLeaf(documentEntries[0])

  return state
})

const log = (name: string, ...args: any[]) => {
  console.log('[LOG] event name: ', name)
  console.log('[LOG]', ...args)
}

const showGettingStarted = true

/** Controls the visibility of the search input */
const isSearchVisible = ref(false)
</script>

<template>
  <ScalarSidebar
    layout="client"
    :state="sidebarState"
    @reorder="(...args) => log('reorder', ...args)">
    <template #search>
      <div
        class="bg-sidebar-b-1 sticky top-0 z-1 flex flex-col gap-3 px-3 pt-3">
        <div class="flex items-center justify-between">
          <ScalarMenu>
            <template #products>
              <!-- <AppHeaderProducts /> -->
            </template>
            <template #sections="{ close }">
              <SidebarMenuWorkspace
                v-model="workspaceModel"
                @close="close" />
              <!-- <AppHeaderTeam
                v-if="isLoggedIn"
                @close="close" />
              <AppHeaderLoggedOut v-else /> -->
              <ScalarMenuResources />
              <ScalarMenuSupport />
            </template>
          </ScalarMenu>

          <ScalarIconButton
            :icon="ScalarIconMagnifyingGlass"
            label="Search"
            @click="isSearchVisible = !isSearchVisible" />
        </div>

        <!-- Actual search input -->
        <ScalarSidebarSearchInput
          v-if="isSearchVisible"
          autofocus />
      </div>
    </template>

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
            @click="emit('openCommandPalette', 'import')">
            Import Collection
          </ScalarButton>

          <ScalarButton
            class="w-full"
            :click="emit('openCommandPalette')"
            hotkey="K"
            size="sm"
            variant="outlined">
            Add Item
          </ScalarButton>
        </div>
      </div>
    </template>
  </ScalarSidebar>
</template>

<style scoped>
.search-button-fade {
  background: linear-gradient(
    var(--scalar-background-1) 32px,
    color-mix(in srgb, var(--scalar-background-1), transparent) 38px,
    transparent
  );
}
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
