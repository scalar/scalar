<script setup lang="ts">
import { Sidebar } from '@/components'
import ActionModal from '@/components/ActionModal/ActionModal.vue'
import AddressBar from '@/components/AddressBar/AddressBar.vue'
import SearchButton from '@/components/Search/SearchButton.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { themeClasses } from '@/constants'
import { type ActionModalTab, useActionModal, useSidebar } from '@/hooks'
import { executeRequestBus, sendRequest } from '@/libs'
import { useWorkspace } from '@/store/workspace'
import RequestSection from '@/views/Request/RequestSection/RequestSection.vue'
import ResponseSection from '@/views/Request/ResponseSection/ResponseSection.vue'
import { ScalarIcon } from '@scalar/components'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import { REQUEST_METHODS, type RequestMethod } from '@scalar/oas-utils/helpers'
import { isMacOS } from '@scalar/use-tooltip'
import { useEventListener, useMagicKeys } from '@vueuse/core'
import { type DeepReadonly, computed, ref } from 'vue'

import RequestSidebarItem from './RequestSidebarItem.vue'

const {
  activeExample,
  activeRequest,
  activeServer,
  collections,
  modalState,
  workspace,
} = useWorkspace()
const { collapsedSidebarFolders } = useSidebar()
const actionModalState = useActionModal()
const showSideBar = ref(false)

const handleTabChange = (activeTab: string) => {
  actionModalState.tab = activeTab as ActionModalTab
}

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
executeRequestBus.on(async () => {
  if (!activeRequest.value || !activeExample.value) {
    console.warn(
      'There is no request active at the moment. Please select one then try again.',
    )
    return
  }

  const { request, response } = await sendRequest(
    activeRequest.value,
    activeExample.value,
    /** to be added as a fullUrl?  */
    activeServer.value?.url + activeRequest.value.path,
  )

  if (request && response) {
    activeRequest.value.history.push({ request, response })
  } else {
    console.warn('No response or request was returned')
  }
})

// TODO temp switch for folder mode
const FOLDER_MODE = true

const workspaceCollections = computed(() =>
  workspace.collectionUids.map((uid) => collections[uid]),
)
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

const addItemHandler = () => {
  actionModalState.show()
}
const getBackgroundColor = () => {
  if (!activeRequest.value) return ''
  const { method } = activeRequest.value
  return REQUEST_METHODS[method as RequestMethod].backgroundColor
}

const keys = useMagicKeys()

useEventListener(document, 'keydown', (event) => {
  if ((isMacOS() ? keys.meta.value : keys.ctrl.value) && event.key === 'b') {
    showSideBar.value = !showSideBar.value
  }
})
</script>
<template>
  <div
    class="bg-mix-transparent bg-mix-amount-95 flex flex-1 flex-col rounded-lg rounded-b-none rounded-r-none pt-0 h-full"
    :class="getBackgroundColor()"
    style="
      background: linear-gradient(
        color-mix(in srgb, var(--tw-bg-base) 6%, transparent) 1%,
        var(--scalar-background-2) 9%
      );
    ">
    <div
      class="lg:min-h-header flex items-center w-full justify-center p-1 flex-wrap t-app__top-container">
      <div
        class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-0.5 lg:flex-1 w-6/12">
        <button
          class="request-text-color bg-mix-transparent hover:bg-mix-amount-95 p-2 rounded bg-mix-amount-100"
          :class="getBackgroundColor()"
          type="button"
          @click="showSideBar = !showSideBar">
          <ScalarIcon
            :icon="showSideBar ? 'SideBarOpen' : 'SideBarClosed'"
            size="sm" />
        </button>
      </div>
      <AddressBar />
      <div
        class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-0.5 lg:flex-1 justify-end w-6/12">
        <!-- <button
          class="request-text-color-text bg-mix-transparent hover:bg-mix-amount-95 px-2 py-1.5 rounded bg-mix-amount-90 font-medium text-sm"
          :class="getBackgroundColor()"
          type="button">
          Test Acctual Locally
        </button> -->
        <button
          v-if="workspace.isReadOnly"
          class="request-text-color bg-mix-transparent hover:bg-mix-amount-95 p-2 rounded bg-mix-amount-100"
          :class="getBackgroundColor()"
          type="button"
          @click="modalState.hide()">
          <ScalarIcon
            icon="Close"
            size="xs" />
        </button>
      </div>
    </div>
    <ViewLayout>
      <Sidebar
        v-if="showSideBar"
        :class="[showSideBar ? 'sidebar-active-width' : '']">
        <template #title>{{ workspace.name }}</template>
        <template #content>
          <SearchButton></SearchButton>
          <div
            class="custom-scroll flex flex-1 flex-col overflow-visible px-3 pb-12 pt-2.5"
            @dragenter.prevent
            @dragover.prevent>
            <!-- Collections -->
            <RequestSidebarItem
              v-for="(collection, collectionIndex) in workspaceCollections"
              :key="collection.uid"
              :isDraggable="FOLDER_MODE && !workspace.isReadOnly"
              :isDroppable="FOLDER_MODE && !workspace.isReadOnly"
              :item="collection"
              :parentUids="[]"
              @onDragEnd="
                (...args) => onDragEnd(collection, collectionIndex, ...args)
              ">
              <template #leftIcon>
                <ScalarIcon
                  class="text-sidebar-c-2 stroke-[1] text-sm group-hover:hidden"
                  icon="CodeFolder"
                  size="sm" />
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
            v-if="!workspace.isReadOnly"
            :click="addItemHandler">
            <template #title>Add Item</template>
          </SidebarButton>
        </template>
      </Sidebar>
      <!-- TODO possible loading state -->
      <ViewLayoutContent
        v-if="activeExample"
        :class="[
          themeClasses.view,
          showSideBar ? 'sidebar-active-hide-layout' : '',
        ]">
        <RequestSection />
        <ResponseSection
          :response="
            activeRequest?.history?.[activeRequest?.history?.length - 1]
              ?.response
          " />
      </ViewLayoutContent>
      <ActionModal
        :state="actionModalState"
        @update:tab="handleTabChange" />
    </ViewLayout>
  </div>
</template>
<style scoped>
.request-text-color {
  color: color-mix(in srgb, var(--tw-bg-base) 15%, var(--scalar-color-3));
}
.request-text-color-text {
  color: color-mix(in srgb, var(--tw-bg-base) 25%, var(--scalar-color-1));
}
.request-text-color-text:active,
.request-text-color:active {
  color: var(--scalar-color-1);
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
</style>
