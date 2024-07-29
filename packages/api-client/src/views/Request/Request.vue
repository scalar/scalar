<script setup lang="ts">
import { Sidebar } from '@/components'
import AddressBar from '@/components/AddressBar/AddressBar.vue'
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector.vue'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { useSearch } from '@/components/Search/useSearch'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarToggle from '@/components/Sidebar/SidebarToggle.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useSidebar } from '@/hooks'
import {
  cancelRequestBus,
  executeRequestBus,
  requestStatusBus,
  sendRequest,
} from '@/libs'
import {
  type HotKeyEvents,
  commandPaletteBus,
  hotKeyBus,
} from '@/libs/event-busses'
import { useWorkspace } from '@/store/workspace'
import RequestSection from '@/views/Request/RequestSection/RequestSection.vue'
import ResponseSection from '@/views/Request/ResponseSection/ResponseSection.vue'
import {
  ScalarIcon,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from '@scalar/components'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import { useToasts } from '@scalar/use-toasts'
import { useMediaQuery } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import RequestSidebarItem from './RequestSidebarItem.vue'
import { WorkspaceDropdown } from './components'

const emits = defineEmits<{
  (e: 'newTab', item: { name: string; uid: string }): void
}>()

const {
  activeExample,
  activeRequest,
  activeSecuritySchemes,
  activeWorkspace,
  activeWorkspaceCollections,
  activeWorkspaceServers,
  activeWorkspaceRequests,
  collectionMutators,
  collections,
  cookies,
  environments,
  findRequestFolders,
  folders,
  folderMutators,
  modalState,
  requestMutators,
  workspaceMutators,
} = useWorkspace()

const { collapsedSidebarFolders, setCollapsedSidebarFolder } = useSidebar()
const { toast } = useToasts()
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

const isNarrow = useMediaQuery('(max-width: 780px)')
const showSideBar = ref(!activeWorkspace.value?.isReadOnly)
const requestAbortController = ref<AbortController>()

/** Show / hide the sidebar when we resize the screen */
watch(isNarrow, (narrow) => (showSideBar.value = !narrow))

/** Watch to see if activeRequest changes and ensure we open any folders */
watch(
  activeRequest,
  (request) => {
    if (!request) return

    // Ensure the sidebar folders are open
    findRequestFolders(request.uid).forEach((uid) =>
      setCollapsedSidebarFolder(uid, true),
    )
  },
  { immediate: true },
)

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
const executeRequest = async () => {
  if (!activeRequest.value || !activeExample.value) {
    console.warn(
      'There is no request active at the moment. Please select one then try again.',
    )
    return
  }

  let url = activeExample.value.url

  const variables: Record<string, any> = Object.values(environments).reduce(
    (prev, env) => {
      try {
        return { ...prev, ...JSON.parse(env.raw) }
      } catch {
        return prev
      }
    },
    {},
  )

  const doubleCurlyBrackets = /\{\{(.*?)\}\}/g
  url = url.replace(doubleCurlyBrackets, (_match, key) => {
    // check if a server
    // eslint-disable-next-line consistent-return
    activeWorkspaceServers.value.forEach((server) => {
      if (server.url === key) {
        return key
      }
    })

    return variables[key] || key
  })

  requestStatusBus.emit('start')
  try {
    requestAbortController.value = new AbortController()
    const { request, response, error } = await sendRequest(
      activeRequest.value,
      activeExample.value,
      url,
      activeSecuritySchemes.value,
      activeWorkspace.value?.proxyUrl,
      cookies,
      requestAbortController.value?.signal,
    )

    if (request && response) {
      requestMutators.edit(activeRequest.value.uid, 'history', [
        ...activeRequest.value.history,
        {
          request,
          response,
          timestamp: Date.now(),
        },
      ])
      requestStatusBus.emit('stop')
    } else {
      if (error?.code !== 'ERR_CANCELED')
        toast(error?.message ?? 'Send Request Failed', 'error')
      requestStatusBus.emit('abort')
    }
  } catch (error) {
    console.error(error)
    toast(`Oops! \n${error}`, 'error')
    requestStatusBus.emit('abort')
  }
}

/** Handle hotkey events from the bus */
const handleHotKey = (event: HotKeyEvents) => {
  if (event.toggleSidebar) showSideBar.value = !showSideBar.value

  // We prevent default on open command so we can use it on the web
  if (event.openCommandPalette) {
    event.openCommandPalette.preventDefault()
    commandPaletteBus.emit()
  }

  if (event.focusRequestSearch) {
    searchInputRef.value?.focus()
  }

  if (event.navigateSearchResultsUp) {
    navigateSearchResults('up')
  }

  if (event.navigateSearchResultsDown) {
    navigateSearchResults('down')
  }

  if (event.selectSearchResult) {
    selectSearchResult()
  }
}

/** Cancel a live request */
const cancelRequest = async () => requestAbortController.value?.abort()
onMounted(() => {
  executeRequestBus.on(executeRequest)
  cancelRequestBus.on(cancelRequest)
  hotKeyBus.on(handleHotKey)
})

/**
 * Need to manually remove listener on unmount due to vueuse memory leak
 *
 * @see https://github.com/vueuse/vueuse/issues/3498#issuecomment-2055546566
 */
onBeforeUnmount(() => {
  executeRequestBus.off(executeRequest)
  hotKeyBus.off(handleHotKey)
})

/** Mutate folder OR collection */
const mutate = (uid: string, childUids: string[]) => {
  if (collections[uid]) collectionMutators.edit(uid, 'childUids', childUids)
  else if (folders[uid]) folderMutators.edit(uid, 'childUids', childUids)
}

/** When user stops dragging and drops an item */
const onDragEnd = (draggingItem: DraggingItem, hoveredItem: HoveredItem) => {
  if (!draggingItem || !hoveredItem) return

  const { id: draggingUid, parentId: draggingParentUid } = draggingItem
  const { id: hoveredUid, parentId: hoveredParentUid, offset } = hoveredItem

  // Parent is the workspace
  if (!draggingParentUid) {
    workspaceMutators.edit(
      activeWorkspace.value.uid,
      'collectionUids',
      activeWorkspace.value.collectionUids.filter((uid) => uid !== draggingUid),
    )
  }
  // Parent is collection
  else if (collections[draggingParentUid]) {
    collectionMutators.edit(
      draggingParentUid,
      'childUids',
      collections[draggingParentUid].childUids.filter(
        (uid) => uid !== draggingUid,
      ),
    )
  }
  // Parent is a folder
  else if (folders[draggingParentUid]) {
    folderMutators.edit(
      draggingParentUid,
      'childUids',
      folders[draggingParentUid].childUids.filter((uid) => uid !== draggingUid),
    )
  }

  // Place it at the end of the list of the hoveredItem
  if (offset === 2) {
    const parent = collections[hoveredUid] || folders[hoveredUid]
    mutate(hoveredUid, [...parent.childUids, draggingUid])
  }
  // Special case for collections
  else if (!hoveredParentUid) {
    const newChildUids = [...activeWorkspace.value.collectionUids]
    const hoveredIndex =
      newChildUids.findIndex((uid) => hoveredUid === uid) ?? 0
    newChildUids.splice(hoveredIndex + offset, 0, draggingUid)

    workspaceMutators.edit(
      activeWorkspace.value.uid,
      'collectionUids',
      newChildUids,
    )
  }
  // Place it into the list at an index
  else {
    const parent = collections[hoveredParentUid] || folders[hoveredParentUid]
    const newChildUids = [...parent.childUids]

    const hoveredIndex =
      newChildUids.findIndex((uid) => hoveredUid === uid) ?? 0
    newChildUids.splice(hoveredIndex + offset, 0, draggingUid)

    mutate(hoveredParentUid, newChildUids)
  }
}

/** Ensure only collections are allowed at the top level OR resources dropped INTO (offset 2) */
const _isDroppable = (draggingItem: DraggingItem, hoveredItem: HoveredItem) => {
  // Cannot drop in read only mode
  if (activeWorkspace.value.isReadOnly) return false
  // Cannot drop requests/folders into a workspace
  if (!collections[draggingItem.id] && hoveredItem.offset !== 2) return false
  // Collections cannot drop over Drafts
  if (
    collections[draggingItem.id] &&
    collections[hoveredItem.id]?.spec?.info?.title === 'Drafts'
  )
    return false

  return true
}

const newTab = (name: string, uid: string) => {
  emits('newTab', { name, uid })
}
</script>
<template>
  <div
    class="flex flex-1 flex-col rounded pt-0 h-full bg-b-1 relative border-1/2 rounded mr-1.5 mb-1.5 overflow-hidden"
    :class="{
      '!mr-0 !mb-0 !border-0': activeWorkspace.isReadOnly,
    }">
    <div
      class="lg:min-h-header flex items-center w-full justify-center p-1 flex-wrap t-app__top-container border-b-1/2">
      <div
        class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-0.5 lg:flex-1 w-6/12">
        <SidebarToggle
          v-model="showSideBar"
          class="gitbook-hidden" />
        <a
          class="text-c-2 text-sm font-medium gitbook-show ml-.5 hover:text-c-1 border p-1 rounded hover:bg-b-3"
          href="https://scalar.com/"
          target="_blank">
          Powered by Scalar.com
        </a>
      </div>
      <AddressBar />
      <div
        class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-0.5 lg:flex-1 justify-end w-6/12">
        <EnvironmentSelector v-if="!activeWorkspace.isReadOnly" />
        <!-- TODO: There should be an `ìsModal` flag instead -->
        <button
          v-if="activeWorkspace.isReadOnly"
          class="text-c-3 hover:bg-b-2 active:text-c-1 p-2 rounded"
          type="button"
          @click="modalState.hide()">
          <ScalarIcon
            icon="Close"
            size="lg"
            thickness="1.75" />
        </button>
      </div>
    </div>
    <ViewLayout>
      <Sidebar
        v-show="showSideBar"
        :class="[showSideBar ? 'sidebar-active-width' : '']"
        :showSideBar="showSideBar"
        @update:showSideBar="showSideBar = $event">
        <template
          v-if="!activeWorkspace.isReadOnly"
          #header>
          <WorkspaceDropdown />
        </template>
        <template #content>
          <div class="search-button-fade sticky px-3 py-2.5 top-0 z-50">
            <ScalarSearchInput
              ref="searchInputRef"
              v-model="searchText"
              sidebar
              @input="fuseSearch" />
          </div>
          <div
            class="custom-scroll flex flex-1 flex-col overflow-visible px-3 pb-3 pt-0"
            :class="{
              'pb-14': !activeWorkspace.isReadOnly,
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
                :isDraggable="
                  !activeWorkspace.isReadOnly &&
                  collection.spec?.info?.title !== 'Drafts'
                "
                :isDroppable="_isDroppable"
                :item="collection"
                :parentUids="[]"
                @newTab="newTab"
                @onDragEnd="onDragEnd">
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
            v-if="!activeWorkspace.isReadOnly"
            :class="{
              'empty-sidebar-item': activeWorkspaceRequests.length === 1,
            }"
            :click="commandPaletteBus.emit">
            <template #title>Add Item</template>
          </SidebarButton>
        </template>
      </Sidebar>
      <!-- TODO possible loading state -->
      <ViewLayoutContent
        v-if="activeExample"
        class="flex-1"
        :class="[showSideBar ? 'sidebar-active-hide-layout' : '']">
        <RequestSection />
        <ResponseSection
          :response="
            activeRequest?.history?.[activeRequest?.history?.length - 1]
              ?.response
          " />
      </ViewLayoutContent>
    </ViewLayout>
  </div>
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
.search-button-fade {
  background: linear-gradient(
    var(--scalar-background-1) 44px,
    color-mix(in srgb, var(--scalar-background-1), transparent) 50px,
    transparent
  );
}
@media screen and (max-width: 780px) {
  .sidebar-active-hide-layout {
    display: none;
  }
  .sidebar-active-width {
    width: 100%;
    border: 1px solid var(--scalar-border-color);
    border-radius: var(--scalar-radius);
  }
}
.gitbook-show {
  display: none;
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
</style>
