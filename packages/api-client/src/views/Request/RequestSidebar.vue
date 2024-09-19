<script setup lang="ts">
import { Sidebar } from '@/components'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { useSearch } from '@/components/Search/useSearch'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import { useSidebar } from '@/hooks'
import { type HotKeyEvents, commandPaletteBus, hotKeyBus } from '@/libs'
import { useWorkspace } from '@/store'
import { dragHandlerFactory } from '@/views/Request/handle-drag'
import {
  ScalarIcon,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from '@scalar/components'
import { onBeforeUnmount, onMounted, watch } from 'vue'

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
} = workspaceContext

const { handleDragEnd, isDroppable } = dragHandlerFactory(workspaceContext)
const { collapsedSidebarFolders, setCollapsedSidebarFolder } = useSidebar()

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
const handleHotKey = (event: HotKeyEvents) => {
  if (event.toggleSidebar) emit('update:showSidebar', props.showSidebar)

  // We prevent default on open command so we can use it on the web
  if (event.openCommandPalette) {
    event.openCommandPalette.preventDefault()
    commandPaletteBus.emit()
  }

  if (event.focusRequestSearch) {
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  hotKeyBus.on(handleHotKey)
})

/**
 * Need to manually remove listener on unmount due to vueuse memory leak
 *
 * @see https://github.com/vueuse/vueuse/issues/3498#issuecomment-2055546566
 */
onBeforeUnmount(() => {
  hotKeyBus.off(handleHotKey)
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
      <WorkspaceDropdown />
    </template>
    <template #content>
      <div class="search-button-fade sticky px-3 py-2.5 top-0 z-50">
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
            :parentUids="[]"
            :uid="collection.uid"
            @newTab="(name, uid) => emit('newTab', { name, uid })"
            @onDragEnd="handleDragEnd">
            <template #leftIcon>
              <ScalarIcon
                class="text-sidebar-c-2 text-sm group-hover:hidden"
                icon="CodeFolder"
                size="sm"
                thickness="2" />
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
      <SidebarButton
        v-if="!isReadonly"
        :class="{
          'empty-sidebar-item': activeWorkspaceRequests.length === 1,
        }"
        :click="commandPaletteBus.emit">
        <template #title>Add Item</template>
      </SidebarButton>
    </template>
  </Sidebar>
</template>
<style scoped>
.search-button-fade {
  background: linear-gradient(
    var(--scalar-background-1) 44px,
    color-mix(in srgb, var(--scalar-background-1), transparent) 50px,
    transparent
  );
}
</style>
