<script setup lang="ts">
import { Sidebar } from '@/components'
import ActionModal from '@/components/ActionModal/ActionModal.vue'
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import { themeClasses } from '@/constants'
import { type ActionModalTab, useActionModal, useSidebar } from '@/hooks'
import { executeRequestBus, sendRequest } from '@/libs'
import { useWorkspace } from '@/store/workspace'
import RequestSection from '@/views/Request/RequestSection/RequestSection.vue'
import ResponseSection from '@/views/Request/ResponseSection/ResponseSection.vue'
import { ScalarIcon } from '@scalar/components'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import { type DeepReadonly, computed } from 'vue'

import RequestSidebarItem from './RequestSidebarItem.vue'

defineEmits<{ (event: 'openModal', tab: string): void }>()

const { activeExample, activeRequest, activeServer, collections, workspace } =
  useWorkspace()
const { collapsedSidebarFolders } = useSidebar()
const modalState = useActionModal()

const handleTabChange = (activeTab: string) => {
  modalState.tab = activeTab as ActionModalTab
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
  modalState.show()
}
</script>
<template>
  <Sidebar>
    <template #title>Workspace Name</template>
    <template #content>
      <div class="bg-b-1 sticky top-0 z-50 px-3 py-2.5 pb-0">
        <button
          class="h-8 shadow-inset text-c-2 flex w-full items-center rounded p-1.5"
          type="button">
          <ScalarIcon
            icon="Search"
            size="xs" />
          <div
            class="sidebar-search-input ml-1.5 flex w-full items-center justify-between text-sm font-medium">
            <span class="sidebar-search-placeholder">Search</span>
            <ScalarHotkey hotkey="k" />
          </div>
        </button>
      </div>
      <div
        class="custom-scroll flex flex-1 flex-col overflow-visible px-3 pb-12 pt-2.5"
        @dragenter.prevent
        @dragover.prevent>
        <!-- Collections -->
        <RequestSidebarItem
          v-for="(collection, collectionIndex) in workspaceCollections"
          :key="collection.uid"
          :isDraggable="FOLDER_MODE"
          :isDroppable="FOLDER_MODE"
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
      <SidebarButton :click="addItemHandler">
        <template #title>Add Item</template>
      </SidebarButton>
    </template>
  </Sidebar>

  <!-- TODO possible loading state -->
  <ViewLayout
    v-if="activeExample"
    :class="[themeClasses.view]">
    <RequestSection />
    <ResponseSection
      :response="
        activeRequest?.history?.[activeRequest?.history?.length - 1]?.response
      " />
  </ViewLayout>
  <ActionModal
    :state="modalState"
    @update:tab="handleTabChange" />
</template>
