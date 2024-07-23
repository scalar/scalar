<script setup lang="ts">
import { Sidebar } from '@/components'
import AddressBar from '@/components/AddressBar/AddressBar.vue'
import SearchButton from '@/components/Search/SearchButton.vue'
import SearchModal from '@/components/Search/SearchModal.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarToggle from '@/components/Sidebar/SidebarToggle.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useSidebar } from '@/hooks'
import { executeRequestBus, sendRequest } from '@/libs'
import { commandPaletteBus } from '@/libs/eventBusses/command-palette'
import { useWorkspace } from '@/store/workspace'
import RequestSection from '@/views/Request/RequestSection/RequestSection.vue'
import ResponseSection from '@/views/Request/ResponseSection/ResponseSection.vue'
import { ScalarIcon, useModal } from '@scalar/components'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import { REQUEST_METHODS, type RequestMethod } from '@scalar/oas-utils/helpers'
import { isMacOS } from '@scalar/use-tooltip'
import { useEventListener, useMagicKeys } from '@vueuse/core'
import { type DeepReadonly, onBeforeUnmount, onMounted, ref } from 'vue'

import RequestSidebarItem from './RequestSidebarItem.vue'
import { WorkspaceDropdown } from './components'

const {
  activeExample,
  activeRequest,
  activeSecurityScheme,
  activeWorkspaceServers,
  activeWorkspace,
  environments,
  requestMutators,
  activeWorkspaceCollections,
  modalState,
} = useWorkspace()
const { collapsedSidebarFolders } = useSidebar()
const searchModalState = useModal()
const showSideBar = ref(!activeWorkspace.value?.isReadOnly)

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
    activeWorkspaceServers.value.forEach((server) => {
      if (server.url === key) {
        return key
      }
    })

    return variables[key] || key
  })

  const { request, response } = await sendRequest(
    activeRequest.value,
    activeExample.value,
    url,
    activeSecurityScheme.value,
    activeWorkspace.value?.proxyUrl,
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
  } else {
    console.warn('No response or request was returned')
  }
}
onMounted(() => executeRequestBus.on(executeRequest))

/**
 * Need to manually remove listener on unmount due to vueuse memory leak
 *
 * @see https://github.com/vueuse/vueuse/issues/3498#issuecomment-2055546566
 */
onBeforeUnmount(() => executeRequestBus.off(executeRequest))

// const collections = computed(() => {
//   if (FOLDER_MODE) {
//     return workspace.collections
//   }
//   // For tag mode, loop over each collection and organize into tags
//   // Try to use the same object structure as folder mode
//   else {
//     return workspace.collections.map((collection) => {
//       // Create folders out of tags using the tag name as the uid
//       const folders: Collection['folders'] = collection.spec.tags.reduce(
//         (prev, tag) => ({
//           ...prev,
//           [tag.name]: { ...tag, uid: tag.name, children: [] },
//         }),
//         {},
//       )
//       const _requests: string[] = []
//
//       Object.entries(requests).forEach(([key, request]) => {
//         // _requests here are loose aka they have no folder
//         if (!request.tags.length) _requests.push(key)
//
//         // Push the rest into each folder
//         request.tags.forEach((tag) => {
//           folders[tag].children.push(key)
//         })
//       })
//
//       return {
//         ...collection,
//         folders,
//         children: Object.keys(folders),
//         requests: _requests,
//       } as const
//     })
//   }
// })

/**
 * When user stops dragging and drops an item
 *
 * TODO:
 * - prevent dropping operation directly into collection
 */
const onDragEnd = (
  draggingCollection: DeepReadonly<Collection>,
  draggingCollectionIndex: number,
  draggingItem: DraggingItem,
  hoveredItem: HoveredItem,
) => {
  if (!draggingItem || !hoveredItem) return

  // const { id: draggingUid, parentId: draggingParentUid } = draggingItem
  // const { id: hoveredUid, parentId: hoveredParentUid, offset } = hoveredItem
  //
  // // We will always have a parent since top level collections are not draggable... yet
  // if (!draggingParentUid || !hoveredParentUid) return
  //
  // const hoveredCollectionIndex = collections.value.findIndex(
  //   ({ uid, folders }) => uid === hoveredParentUid || folders[hoveredParentUid],
  // )
  //
  // if (hoveredCollectionIndex === -1) return
  // const hoveredCollection = collections.value[hoveredCollectionIndex]
  //
  // // Dropped into the same collection
  // if (draggingCollection.uid === hoveredCollection.uid) {
  //   // Remove from root children
  //   if (draggingCollection.uid === draggingParentUid)
  //     collectionMutators.edit(
  //       draggingCollectionIndex,
  //       'children',
  //       draggingCollection.children.filter((uid) => uid !== draggingUid),
  //     )
  //   // Remove from a folder
  //   else if (draggingCollection.folders[draggingParentUid]?.children) {
  //     collectionMutators.edit(
  //       draggingCollectionIndex,
  //       `folders.${draggingParentUid}.children`,
  //       draggingCollection.folders[draggingParentUid].children.filter(
  //         (uid) => uid !== draggingUid,
  //       ),
  //     )
  //   }
  //
  //   // Dropping into a folder
  //   if (offset === 2) {
  //     const newChildren = [...hoveredCollection.folders[hoveredUid].children]
  //     newChildren.push(draggingUid)
  //
  //     collectionMutators.edit(
  //       draggingCollectionIndex,
  //       `folders.${hoveredUid}.children`,
  //       newChildren,
  //     )
  //   }
  //   // Add to root children
  //   else if (hoveredCollection.uid === hoveredParentUid) {
  //     const hoveredIndex =
  //       hoveredCollection.children.findIndex((uid) => hoveredUid === uid) ?? 0
  //
  //     const newChildren = [...hoveredCollection.children]
  //     newChildren.splice(hoveredIndex + offset, 0, draggingUid)
  //
  //     collectionMutators.edit(draggingCollectionIndex, 'children', newChildren)
  //   }
  //   // Add to folder
  //   else if (hoveredCollection.folders[hoveredParentUid]?.children) {
  //     const hoveredIndex =
  //       hoveredCollection.folders[hoveredParentUid].children.findIndex(
  //         (uid) => hoveredUid === uid,
  //       ) ?? 0
  //
  //     const newChildren = [
  //       ...hoveredCollection.folders[hoveredParentUid].children,
  //     ]
  //     newChildren.splice(hoveredIndex + offset, 0, draggingUid)
  //
  //     collectionMutators.edit(
  //       draggingCollectionIndex,
  //       `folders.${hoveredParentUid}.children`,
  //       newChildren,
  //     )
  //   }
  // }
  // TODO write this when we have more than one collection to test with
  // We need to do a few extra things when its a different collection
  // else {
  // }
}

/* Opens the Command Palette */
const addItemHandler = () => commandPaletteBus.emit()

const keys = useMagicKeys()

useEventListener(document, 'keydown', (event) => {
  if ((isMacOS() ? keys.meta.value : keys.ctrl.value) && event.key === 'b') {
    showSideBar.value = !showSideBar.value
  }
  if ((isMacOS() ? keys.meta.value : keys.ctrl.value) && event.key === 'k') {
    searchModalState.open ? searchModalState.hide() : searchModalState.show()
  }
})

const getBackgroundColor = () => {
  if (!activeRequest.value) return ''
  const { method } = activeRequest.value
  return REQUEST_METHODS[method as RequestMethod].backgroundColor
}
</script>
<template>
  <div
    class="flex flex-1 flex-col rounded rounded-b-none rounded-r-none pt-0 h-full client-wrapper-bg-color relative"
    :class="getBackgroundColor()">
    <div
      class="lg:min-h-header flex items-center w-full justify-center p-1 flex-wrap t-app__top-container">
      <div
        class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-0.5 lg:flex-1 w-6/12">
        <SidebarToggle
          v-model="showSideBar"
          class="gitbook-hidden" />
        <div class="text-c-2 text-sm font-medium gitbook-show pl-2">
          Powered by
          <a
            class="hover:text-c-1"
            href="https://scalar.com/"
            target="_blank"
            >Scalar.com</a
          >
        </div>
      </div>
      <AddressBar />
      <div
        class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-0.5 lg:flex-1 justify-end w-6/12">
        <!-- TODO: There should be an `ìsModal` flag instead -->
        <button
          v-if="activeWorkspace.isReadOnly"
          class="text-c-3 hover:bg-b-3 active:text-c-1 p-2 rounded"
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
        :class="[showSideBar ? 'sidebar-active-width' : '']">
        <template
          v-if="!activeWorkspace.isReadOnly"
          #header>
          <WorkspaceDropdown />
        </template>
        <template #content>
          <SearchButton @openSearchModal="searchModalState.show()" />
          <div
            class="custom-scroll flex flex-1 flex-col overflow-visible px-3 pb-12 pt-2.5"
            @dragenter.prevent
            @dragover.prevent>
            <!-- Collections -->
            <RequestSidebarItem
              v-for="(
                collection, collectionIndex
              ) in activeWorkspaceCollections"
              :key="collection.uid"
              :isDraggable="!activeWorkspace.isReadOnly"
              :isDroppable="!activeWorkspace.isReadOnly"
              :item="collection"
              :parentUids="[]"
              @onDragEnd="
                (...args) => onDragEnd(collection, collectionIndex, ...args)
              ">
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
          </div>
        </template>
        <template #button>
          <SidebarButton
            v-if="!activeWorkspace.isReadOnly"
            :click="addItemHandler">
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
  <SearchModal :modalState="searchModalState" />
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
.dark-mode .client-wrapper-bg-color {
  background: linear-gradient(
    color-mix(in srgb, var(--tw-bg-base) 6%, transparent) 1%,
    color-mix(in srgb, var(--scalar-background-1) 30%, black) 9%
  );
}
.light-mode .client-wrapper-bg-color {
  background-color: var(--scalar-background-2) !important;
}
.gitbook-show {
  display: none;
}
</style>
