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
import { useActiveEntities } from '@/store/active-entities'
import { createInitialRequest } from '@/store/requests'
import RequestSidebarItemMenu from '@/views/Request/RequestSidebarItemMenu.vue'
import { dragHandlerFactory } from '@/views/Request/handle-drag'
import type { SidebarItem, SidebarMenuItem } from '@/views/Request/types'
import {
  ScalarButton,
  ScalarIcon,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  useId,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'

import RequestSidebarItem from './RequestSidebarItem.vue'

const props = defineProps<{
  showSidebar: boolean
  isReadonly: boolean
}>()

const emit = defineEmits<{
  (e: 'update:showSidebar', v: boolean): void
  (e: 'newTab', { name, uid }: { name: string; uid: string }): void
  (e: 'clearDrafts'): void
}>()

const workspaceContext = useWorkspace()
const {
  activeWorkspaceCollections,
  activeRequest,
  activeWorkspaceRequests,
  activeWorkspace,
} = useActiveEntities()
const { findRequestParents, isReadOnly, events, requestMutators, requests } =
  workspaceContext

const { handleDragEnd, isDroppable } = dragHandlerFactory(workspaceContext)
const { collapsedSidebarFolders, setCollapsedSidebarFolder } = useSidebar()
const { replace } = useRouter()
const openCommandPaletteImport = () => {
  events.commandPalette.emit({ commandName: 'Import from OpenAPI/Swagger' })
}
const searchResultsId = useId()

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

const handleToggleWatchMode = (item?: SidebarItem) => {
  if (item?.documentUrl) {
    item.watchMode = !item.watchMode
  }
}

const selectedResultId = computed(() => {
  const result =
    searchResultsWithPlaceholderResults.value[selectedSearchResult.value]
  return result?.item?.id ? `#search-input-${result.item.id}` : undefined
})

const handleClearDrafts = () => {
  const draftCollection = activeWorkspaceCollections.value.find(
    (collection) => collection.info?.title === 'Drafts',
  )

  if (draftCollection) {
    draftCollection.requests.forEach((requestUid) => {
      requestMutators.delete(requests[requestUid], draftCollection.uid)
    })
  }

  const hasRequests = activeWorkspaceRequests.value.length

  if (!hasRequests) {
    const { request } = createInitialRequest()

    if (draftCollection) {
      requestMutators.add(request, draftCollection.uid)
      replace(`/workspace/${activeWorkspace.value.uid}/request/${request.uid}`)
    }
  } else {
    const firstCollection = activeWorkspaceCollections.value[0]
    const firstRequest = firstCollection?.requests[0]

    if (firstRequest) {
      replace(`/workspace/${activeWorkspace.value.uid}/request/${firstRequest}`)
    }
  }
}
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
    </template>
    <template #content>
      <div
        class="search-button-fade sticky px-3 py-2.5 top-0 z-10"
        role="search">
        <ScalarSearchInput
          ref="searchInputRef"
          v-model="searchText"
          :aria-activedescendant="selectedResultId"
          :aria-controls="searchResultsId"
          sidebar
          @input="fuseSearch"
          @keydown.down.stop="navigateSearchResults('down')"
          @keydown.enter.stop="selectSearchResult()"
          @keydown.up.stop="navigateSearchResults('up')" />
      </div>
      <div
        class="flex flex-1 flex-col overflow-visible px-3 pb-3 pt-0"
        :class="{
          'pb-14': !isReadonly,
        }"
        @dragenter.prevent
        @dragover.prevent>
        <template v-if="searchText">
          <ScalarSearchResultList
            :id="searchResultsId"
            aria-label="Search Results"
            class="gap-px"
            :noResults="!searchResultsWithPlaceholderResults.length">
            <ScalarSearchResultItem
              v-for="(entry, index) in searchResultsWithPlaceholderResults"
              :id="`#search-input-${entry.item.id}`"
              :key="entry.refIndex"
              :ref="(el) => (searchResultRefs[index] = el as HTMLElement)"
              :active="selectedSearchResult === index"
              class="px-2"
              :href="entry.item.link"
              @click.prevent="onSearchResultClick(entry)"
              @focus="selectedSearchResult = index">
              {{ entry.item.title }}
              <template #addon>
                <span class="sr-only">HTTP Method:</span>
                <HttpMethod
                  class="font-bold"
                  :method="entry.item.httpVerb ?? 'get'" />
              </template>
            </ScalarSearchResultItem>
          </ScalarSearchResultList>
        </template>
        <nav
          v-else
          class="contents">
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
                thickness="2.25" />
              <LibraryIcon
                v-else
                class="min-w-3.5 text-sidebar-c-2 size-3.5 stroke-2 group-hover:hidden"
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
                  size="sm"
                  thickness="2" />
              </div>
            </template>
          </RequestSidebarItem>
        </nav>
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
        <ScalarButton
          v-if="!isReadonly"
          class="mb-1.5 w-full h-fit hidden opacity-0 p-1.5"
          :class="{
            'flex opacity-100': activeWorkspaceRequests.length <= 1,
          }"
          @click="openCommandPaletteImport">
          Import Collection
        </ScalarButton>
        <SidebarButton
          v-if="!isReadonly"
          :click="events.commandPalette.emit"
          hotkey="K">
          <template #title>Add Item</template>
        </SidebarButton>
      </div>
    </template>
  </Sidebar>

  <!-- Menu -->
  <RequestSidebarItemMenu
    v-if="!isReadOnly && menuItem"
    :menuItem="menuItem"
    @clearDrafts="handleClearDrafts"
    @closeMenu="menuItem.open = false"
    @toggleWatchMode="handleToggleWatchMode" />
</template>
<style scoped>
.search-button-fade {
  background: linear-gradient(
    var(--scalar-background-1) 44px,
    color-mix(in srgb, var(--scalar-background-1), transparent) 50px,
    transparent
  );
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
