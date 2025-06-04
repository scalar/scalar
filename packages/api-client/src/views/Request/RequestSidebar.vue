<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarSearchResultItem,
  ScalarSearchResultList,
  ScalarSidebarSearchInput,
} from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  useId,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'

import Rabbit from '@/assets/rabbit.ascii?raw'
import RabbitJump from '@/assets/rabbitjump.ascii?raw'
import { Sidebar } from '@/components'
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector.vue'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { useSearch } from '@/components/Search/useSearch'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import { useLayout } from '@/hooks/useLayout'
import { useSidebar } from '@/hooks/useSidebar'
import type { HotKeyEvent } from '@/libs'
import { PathId } from '@/routes'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { createInitialRequest } from '@/store/requests'
import { dragHandlerFactory } from '@/views/Request/handle-drag'
import RequestSidebarItemMenu from '@/views/Request/RequestSidebarItemMenu.vue'
import type { SidebarItem, SidebarMenuItem } from '@/views/Request/types'

import { WorkspaceDropdown } from './components'
import { isGettingStarted } from './RequestSection/helpers/getting-started'
import RequestSidebarItem from './RequestSidebarItem.vue'

const emit = defineEmits<{
  (e: 'newTab', { name, uid }: { name: string; uid: string }): void
  (e: 'clearDrafts'): void
}>()

const {
  collapsedSidebarFolders,
  isSidebarOpen,
  setCollapsedSidebarFolder,
  toggleSidebarOpen,
} = useSidebar()
const { layout } = useLayout()

const workspaceContext = useWorkspace()
const {
  activeCollection,
  activeWorkspaceCollections,
  activeRequest,
  activeWorkspaceRequests,
  activeWorkspace,
} = useActiveEntities()
const { findRequestParents, events, requestMutators, requests } =
  workspaceContext

const { handleDragEnd, isDroppable } = dragHandlerFactory(
  activeWorkspace,
  workspaceContext,
)
const { replace } = useRouter()
const openCommandPaletteImport = () => {
  events.commandPalette.emit({
    commandName: 'Import from OpenAPI/Swagger/Postman/cURL',
  })
}
const searchResultsId = useId()
const { toast } = useToasts()
/** The currently selected sidebarMenuItem for the context menu */
const menuItem = reactive<SidebarMenuItem>({ open: false })
const isSearchVisible = ref(false)

/** Watch to see if activeRequest changes and ensure we open any folders */
watch(
  activeRequest,
  (request) => {
    if (!request) {
      return
    }

    // Ensure the sidebar folders are open
    findRequestParents(request).forEach((uid: string) =>
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

const searchToggleRef = ref<HTMLButtonElement>()

/** Handle hotkey events from the bus */
const handleHotKey = (event?: HotKeyEvent) => {
  if (!event) {
    return
  }
  if (event.toggleSidebar) {
    toggleSidebarOpen()
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

const handleToggleWatchMode = (item?: SidebarItem) => {
  if (item?.documentUrl) {
    item.watchMode = !item.watchMode
    const currentCollection = activeWorkspaceCollections.value.find(
      (collection: Collection) => collection.uid === item.entity.uid,
    )
    if (currentCollection) {
      currentCollection.watchMode = item.watchMode
    }
  }
}

watch(
  () =>
    activeWorkspaceCollections.value.map(
      (collection: Collection) => collection.watchMode,
    ),
  (newWatchModes, oldWatchModes) => {
    newWatchModes.forEach((newWatchMode: boolean, index: number) => {
      if (
        layout !== 'modal' &&
        newWatchMode !== oldWatchModes[index] &&
        activeWorkspaceCollections.value[index]?.info?.title !== 'Drafts' &&
        activeWorkspaceCollections.value[index]
      ) {
        const currentCollection = activeWorkspaceCollections.value[index]
        if (!currentCollection) {
          return
        }

        const message = `${currentCollection.info?.title}: Watch Mode ${newWatchMode ? 'enabled' : 'disabled'}`
        toast(message, 'info')
      }
    })
  },
)

/** Screen reader label for the search input */
const srLabel = computed<string>(() => {
  const results = searchResultsWithPlaceholderResults.value
  if (!results.length) {
    return 'No results found'
  }

  const result = results[selectedSearchResult.value]?.item
  if (!result) {
    return 'No result selected'
  }

  const resultsFoundLabel = searchText.value.length
    ? `${results.length} result${results.length === 1 ? '' : 's'} found, `
    : ''

  const selectedResultDescription = `, HTTP Method ${result.httpVerb}, Path ${result.path}`

  const selectedResultLabel = `${result.title} ${selectedResultDescription}`

  return `${resultsFoundLabel}Selected: ${selectedResultLabel}`
})

const handleClearDrafts = () => {
  const draftCollection = activeWorkspaceCollections.value.find(
    (collection: Collection) => collection.info?.title === 'Drafts',
  )

  if (draftCollection) {
    draftCollection.requests.forEach((requestUid: string) => {
      if (requests[requestUid]) {
        requestMutators.delete(requests[requestUid], draftCollection.uid)
      }
    })
  }

  const hasRequests = activeWorkspaceRequests.value.length

  // First request in the first collection
  if (hasRequests) {
    const firstCollection = activeWorkspaceCollections.value[0]
    const firstRequest = firstCollection?.requests[0]

    if (firstRequest) {
      replace({
        name: 'request',
        params: {
          [PathId.Request]: firstRequest,
        },
      })
    }
  }
  // Create a new request and go to it
  else {
    const { request } = createInitialRequest()

    if (draftCollection) {
      requestMutators.add(request, draftCollection.uid)

      replace({
        name: 'request',
        params: {
          [PathId.Request]: request.uid,
        },
      })
    }
  }
}

watch(isSearchVisible, (isVisible) => {
  // If we're hiding the search, clear the text
  if (!isVisible) {
    searchText.value = ''
  }
})

const showGettingStarted = computed(() =>
  isGettingStarted(
    activeWorkspaceCollections.value,
    activeWorkspaceRequests.value,
    requests,
  ),
)

/** We ensure in modal mode we only show the current requests collection */
const collections = computed(() => {
  if (layout === 'modal' && activeCollection.value) {
    return [activeCollection.value]
  }
  return activeWorkspaceCollections.value
})

/** Hide the search input if the text is empty */
function handleBlur(e: FocusEvent) {
  // We have to check the blur did not come from the search toggle button
  // otherwise the search will show again form the click event
  if (!searchText.value && e.relatedTarget !== searchToggleRef.value) {
    isSearchVisible.value = false
  }
}
</script>
<template>
  <Sidebar
    v-show="isSidebarOpen"
    :class="[isSidebarOpen ? 'sidebar-active-width' : '']">
    <template
      v-if="layout !== 'modal'"
      #header />
    <template #content>
      <div class="bg-b-1 sticky top-0 z-20 flex h-12 items-center px-3">
        <!-- Holds space for the sidebar toggle -->
        <div
          class="size-8"
          :class="{ 'xl:hidden': layout !== 'modal' }" />
        <WorkspaceDropdown v-if="layout !== 'modal'" />
        <span
          v-if="layout !== 'modal'"
          class="text-c-3">
          /
        </span>
        <EnvironmentSelector v-if="layout !== 'modal'" />
        <button
          ref="searchToggleRef"
          :aria-pressed="isSearchVisible"
          class="ml-auto"
          type="button"
          @click="isSearchVisible = !isSearchVisible">
          <span class="sr-only">
            {{ isSearchVisible ? 'Hide' : 'Show' }} search
          </span>
          <ScalarIcon
            class="text-c-3 hover:bg-b-2 max-h-8 max-w-8 rounded-lg p-1.75 text-sm"
            icon="Search" />
        </button>
      </div>
      <div
        v-if="isSearchVisible"
        class="search-button-fade sticky top-12 z-10 px-3 py-2.5 pt-0 focus-within:z-20"
        role="search">
        <ScalarSidebarSearchInput
          ref="searchInputRef"
          v-model="searchText"
          autofocus
          :aria-controls="searchResultsId"
          :label="srLabel"
          @input="fuseSearch"
          @keydown.down.stop="navigateSearchResults('down')"
          @keydown.enter.stop="selectSearchResult()"
          @keydown.up.stop="navigateSearchResults('up')"
          @blur="handleBlur" />
      </div>
      <div
        class="gap-1/2 flex flex-1 flex-col overflow-visible overflow-y-auto px-3 pt-0 pb-3"
        :class="[
          {
            'pb-14': layout !== 'modal',
          },
          {
            'h-[calc(100%-273.5px)]': showGettingStarted,
          },
        ]"
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
              :selected="selectedSearchResult === index"
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
          <!-- Collection -->
          <RequestSidebarItem
            v-for="collection in collections"
            :key="collection.uid"
            :isDraggable="
              layout !== 'modal' && collection.info?.title !== 'Drafts'
            "
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
                class="text-sidebar-c-2 size-3.5 min-w-3.5 stroke-2 group-hover:hidden"
                :src="
                  collection['x-scalar-icon'] || 'interface-content-folder'
                " />
              <div
                :class="{
                  'rotate-90': collapsedSidebarFolders[collection.uid],
                }">
                <ScalarIcon
                  class="text-c-3 hover:text-c-1 hidden text-sm group-hover:block"
                  icon="ChevronRight"
                  size="md" />
              </div>
            </template>
          </RequestSidebarItem>
        </nav>
      </div>
    </template>
    <template #button>
      <div
        :class="{
          'empty-sidebar-item': showGettingStarted,
        }">
        <div
          v-if="showGettingStarted"
          class="empty-sidebar-item-content px-2.5 py-2.5">
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
            <p class="mt-2">
              Create request, folder, collection or import from OpenAPI/Postman
            </p>
          </div>
        </div>
        <ScalarButton
          v-if="layout !== 'modal'"
          class="mb-1.5 hidden h-fit w-full p-1.5 opacity-0"
          :class="{
            'flex opacity-100': showGettingStarted,
          }"
          @click="openCommandPaletteImport">
          Import Collection
        </ScalarButton>
        <SidebarButton
          v-if="layout !== 'modal'"
          :click="events.commandPalette.emit"
          hotkey="K">
          <template #title> Add Item </template>
        </SidebarButton>
      </div>
    </template>
  </Sidebar>

  <!-- Menu -->
  <RequestSidebarItemMenu
    v-if="layout !== 'modal' && menuItem"
    :menuItem="menuItem"
    @clearDrafts="handleClearDrafts"
    @closeMenu="menuItem.open = false"
    @toggleWatchMode="handleToggleWatchMode" />
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
