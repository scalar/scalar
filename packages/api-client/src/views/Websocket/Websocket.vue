<script setup lang="ts">
import { Sidebar } from '@/components'
import SearchButton from '@/components/Search/SearchButton.vue'
import SearchModal from '@/components/Search/SearchModal.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarToggle from '@/components/Sidebar/SidebarToggle.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useSidebar } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import { ScalarIcon, useModal } from '@scalar/components'
import { ref } from 'vue'

import RequestSidebarItem from '../Request/RequestSidebarItem.vue'
import { WorkspaceDropdown } from '../Request/components'
import WebsocketBar from './WebsocketBar.vue'
import WebsocketResponse from './WebsocketResponse.vue'
import WebsocketSection from './WebsocketSection.vue'

const { activeExample, activeWorkspace, activeWorkspaceCollections } =
  useWorkspace()
const { collapsedSidebarFolders } = useSidebar()
const searchModalState = useModal()

const showSideBar = ref(!activeWorkspace.value?.isReadOnly)
</script>
<template>
  <div
    class="flex flex-1 flex-col rounded rounded-b-none rounded-r-none pt-0 h-full client-wrapper-bg-color relative">
    <div
      class="lg:min-h-header flex items-center w-full justify-center p-1 flex-wrap t-app__top-container">
      <WebsocketBar />
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
              v-for="collection in activeWorkspaceCollections"
              :key="collection.uid"
              :isDraggable="!activeWorkspace.isReadOnly"
              :isDroppable="!activeWorkspace.isReadOnly"
              :item="collection"
              :parentUids="[]">
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
      </Sidebar>
      <!-- TODO possible loading state -->
      <ViewLayoutContent
        v-if="activeExample"
        class="flex-1"
        :class="[showSideBar ? 'sidebar-active-hide-layout' : '']">
        <WebsocketSection />
        <WebsocketResponse />
      </ViewLayoutContent>
    </ViewLayout>
  </div>
  <SearchModal :modalState="searchModalState" />
</template>
