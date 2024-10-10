<script setup lang="ts">
import Rabbit from '@/assets/rabbit.ascii?raw'
import RabbitJump from '@/assets/rabbitjump.ascii?raw'
import { Sidebar } from '@/components'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { useSearch } from '@/components/Search/useSearch'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import { useSidebar } from '@/hooks'
import type { HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import RequestSidebarItemMenu from '@/views/Request/RequestSidebarItemMenu.vue'
import { dragHandlerFactory } from '@/views/Request/handle-drag'
import type { SidebarMenuItem } from '@/views/Request/types'
import {
  ScalarIcon,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue'

import RequestSidebarItem from './RequestSidebarItem.vue'
import { WorkspaceDropdown } from './components'

const props = defineProps<{
  showSidebar: boolean
  isReadonly: boolean
}>()

const emit = defineEmits<{
  (e: 'update:showSidebar', v: boolean): void
  (e: 'newTab', { name, uid }: { name: string; uid: string }): void
}>()

const workspaceContext = useWorkspace()
const {
  activeWorkspaceCollections,
  activeRequest,
  activeWorkspaceRequests,
  findRequestParents,
  isReadOnly,
  events,
} = workspaceContext

const { handleDragEnd, isDroppable } = dragHandlerFactory(workspaceContext)
const { collapsedSidebarFolders, setCollapsedSidebarFolder } = useSidebar()

/** The currently selected sidebarMenuItem for the context menu */
const menuItem = reactive<SidebarMenuItem>({ open: false })

/** Watch to see if activeRequest changes and ensure we open any folders */
watch(
  activeRequest,
  (request) => {
    if (!request) return

    // Ensure the sidebar folders are open
    findRequestParents(request).forEach((uid) =>
      setCollapsedSidebarFolder(uid, true),
    )
  },
  { immediate: true },
)

const {
  searchText,
  searchResultsWithPlaceholderResults,
  selectedSearchResult,
  onSearchResultClick,
  fuseSearch,
  searchInputRef,
  searchResultRefs,
  navigateSearchResults,
  selectSearchResult,
} = useSearch()

/** Handle hotkey events from the bus */
const handleHotKey = (event?: HotKeyEvent) => {
  if (!event) return

  if (event.toggleSidebar) emit('update:showSidebar', props.showSidebar)

  // We prevent default on open command so we can use it on the web
  if (event.openCommandPalette) {
    event.openCommandPalette.preventDefault()
    events.commandPalette.emit()
  }

  if (event.focusRequestSearch) {
    searchInputRef.value?.focus()
  }
}

onMounted(() => events.hotKeys.on(handleHotKey))

/**
 * Need to manually remove listener on unmount due to vueuse memory leak
 *
 * @see https://github.com/vueuse/vueuse/issues/3498#issuecomment-2055546566
 */
onBeforeUnmount(() => {
  events.hotKeys.off(handleHotKey)
})
</script>
<template>
  <Sidebar
    v-show="showSidebar"
    :class="[showSidebar ? 'sidebar-active-width' : '']"
    :showSidebar="showSidebar"
    @update:showSidebar="$emit('update:showSidebar', $event)">
    <template
      v-if="!isReadonly"
      #header>
      <WorkspaceDropdown
        class="xl:min-h-header xl:py-2.5 py-1 px-2.5 border-b-1/2" />
    </template>
    <template #content>
      <div class="search-button-fade sticky px-3 py-2.5 top-0 z-1">
        <ScalarSearchInput
          ref="searchInputRef"
          v-model="searchText"
          sidebar
          @input="fuseSearch"
          @keydown.down.stop="navigateSearchResults('down')"
          @keydown.enter.stop="selectSearchResult()"
          @keydown.up.stop="navigateSearchResults('up')" />
      </div>
      <div
        class="custom-scroll flex flex-1 flex-col overflow-visible px-3 pb-3 pt-0"
        :class="{
          'pb-14': !isReadonly,
        }"
        @dragenter.prevent
        @dragover.prevent>
        <template v-if="searchText">
          <ScalarSearchResultList
            class="gap-px custom-scroll"
            :noResults="!searchResultsWithPlaceholderResults.length">
            <ScalarSearchResultItem
              v-for="(entry, index) in searchResultsWithPlaceholderResults"
              :id="`#search-input-${entry.item.id}`"
              :key="entry.refIndex"
              :ref="(el) => (searchResultRefs[index] = el as HTMLElement)"
              :active="selectedSearchResult === index"
              class="px-2"
              @click="onSearchResultClick(entry)"
              @focus="selectedSearchResult = index">
              {{ entry.item.title }}
              <template #addon>
                <HttpMethod
                  class="font-bold"
                  :method="entry.item.httpVerb ?? 'get'" />
              </template>
            </ScalarSearchResultItem>
          </ScalarSearchResultList>
        </template>
        <template v-else>
          <!-- Collections -->
          <RequestSidebarItem
            v-for="collection in activeWorkspaceCollections"
            :key="collection.uid"
            :isDraggable="!isReadonly && collection.info?.title !== 'Drafts'"
            :isDroppable="isDroppable"
            :menuItem="menuItem"
            :parentUids="[]"
            :uid="collection.uid"
            @newTab="(name, uid) => emit('newTab', { name, uid })"
            @onDragEnd="handleDragEnd"
            @openMenu="(item) => Object.assign(menuItem, item)">
            <template #leftIcon>
              <ScalarIcon
                v-if="collection.info?.title === 'Drafts'"
                class="text-sidebar-c-2 group-hover:hidden"
                icon="Scribble"
                thickness="2.5" />
              <LibraryIcon
                v-else
                class="text-sidebar-c-2 size-3.5 stroke-[2.5] group-hover:hidden"
                :src="
                  collection['x-scalar-icon'] || 'interface-content-folder'
                " />
              <div
                :class="{
                  'rotate-90': collapsedSidebarFolders[collection.uid],
                }">
                <ScalarIcon
                  class="text-c-3 hidden text-sm group-hover:block"
                  icon="ChevronRight"
                  size="sm" />
              </div>
            </template>
          </RequestSidebarItem>
        </template>
      </div>
    </template>
    <template #button>
      <div
        :class="{
          'empty-sidebar-item': activeWorkspaceRequests.length <= 1,
        }">
        <div class="empty-sidebar-item-content px-2.5 py-2.5">
          <div class="w-[60px] h-[68px] m-auto rabbit-ascii mt-2 relative">
            <ScalarAsciiArt
              :art="Rabbit"
              class="font-bold rabbitsit" />
            <ScalarAsciiArt
              :art="RabbitJump"
              class="font-bold absolute top-0 left-0 rabbitjump" />
          </div>
          <div class="text-center text-balance text-sm mb-2 mt-2">
            <b class="font-medium">Let's Get Started</b>
            <p class="mt-2">
              Create request, folder, collection or import OpenAPI document
            </p>
          </div>
        </div>
        <SidebarButton
          v-if="!isReadonly"
          :click="events.commandPalette.emit">
          <template #title>Add Item</template>
        </SidebarButton>
      </div>
    </template>
  </Sidebar>

  <!-- Menu -->
  <RequestSidebarItemMenu
    v-if="!isReadOnly && menuItem"
    :menuItem="menuItem"
    @closeMenu="menuItem.open = false" />
</template>
<style scoped>
.search-button-fade {
  background: linear-gradient(
    var(--scalar-background-1) 44px,
    color-mix(in srgb, var(--scalar-background-1), transparent) 50px,
    transparent
  );
}
.empty-sidebar-item:deep(.scalar-button) {
  background: var(--scalar-button-1);
  color: var(--scalar-button-1-color);
}
.empty-sidebar-item:deep(.scalar-button:hover) {
  background: var(--scalar-button-1-hover);
}
.empty-sidebar-item:deep(.add-item-hotkey) {
  color: var(--scalar-button-1-color);
  background: color-mix(in srgb, var(--scalar-button-1), white 20%);
  border-color: transparent;
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
