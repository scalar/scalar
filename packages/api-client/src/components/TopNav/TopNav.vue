<script setup lang="ts">
import {
  ScalarContextMenu,
  ScalarDropdownButton,
  ScalarDropdownMenu,
  ScalarFloating,
  ScalarIcon,
  type Icon,
} from '@scalar/components'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { ROUTES } from '@/constants'
import type { HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import type { TopNavItemStore } from '@/store/top-nav'

import TopNavItem from './TopNavItem.vue'

const props = defineProps<{
  openNewTab: { name: string; uid: string } | null
}>()
const { activeRequest, activeCollection } = useActiveEntities()
const router = useRouter()
const { events, topNav, topNavMutators, collections, requests } = useWorkspace()
const { copyToClipboard } = useClipboard()

type DecoratedNavItem = { label: string; path: string; icon: Icon }
/**
 * Retrieves tab label, path and icon from a top
 * nav item. Defaults to active item.
 */
function getDecoratedNavItem(itemIdx?: number): DecoratedNavItem {
  const { matchingItem } = topNavMutators.getItem(itemIdx)

  const defaultDecoration: DecoratedNavItem = {
    label: '',
    path: '',
    icon: 'Add',
  }

  if (!matchingItem) return defaultDecoration

  if (matchingItem.requestUid) {
    return {
      label: requests[matchingItem.requestUid]?.summary || 'Untitled Request',
      path: matchingItem.path,
      icon: 'ExternalLink',
    }
  }

  if (matchingItem.collectionUid) {
    return {
      label:
        collections[matchingItem.collectionUid]?.info?.title ||
        'Untitled Collection',
      path: matchingItem.path,
      icon: 'Collection',
    }
  }

  const activeRoute = ROUTES.find((route) => {
    return route.to.name.startsWith(matchingItem.route)
  })

  if (activeRoute) {
    return {
      label: activeRoute.displayName,
      path: matchingItem.path,
      icon: activeRoute.icon,
    }
  }

  return defaultDecoration
}

/**
 * Logic to handle updating the current
 * nav item based on the current route.
 */
function handleNavLabelAdd() {
  const currentRoute = router.currentRoute.value

  const { meta, path, name } = currentRoute

  const isRequest = meta.isRequest
  const isCollection = meta.isCollection

  const topNavItem: Omit<TopNavItemStore, 'uid'> = {
    path,
    route: name?.toString() || '',
    requestUid: isRequest ? (activeRequest?.value?.uid ?? null) : null,
    collectionUid: isCollection ? (activeCollection?.value?.uid ?? null) : null,
  }

  topNavMutators.updateItem(topNavItem)
}

function handleNavRoute() {
  const path = topNavMutators.getItem().matchingItem?.path
  if (path) router.push(path)
}

/**
 * adding a nav item sets the new index and nav item
 * based on the route
 */
function addNavItem() {
  topNavMutators.addItem({})
  handleNavLabelAdd()
}

function setNavItemIdx(itemIdx: number) {
  topNavMutators.setActive(itemIdx)
  handleNavRoute()
}

// when the route changes we need update the active nav item
watch(
  () => router.currentRoute.value.path,
  () => {
    handleNavLabelAdd()
  },
  { immediate: true },
)

function removeNavItem(itemIdx: number) {
  topNavMutators.deleteItem(itemIdx)
  handleNavRoute()
}

const copyUrl = (itemIdx: number) => {
  const path = topNavMutators.getItem(itemIdx).matchingItem?.path
  if (!path) return

  const fullUrl = new URL(window.location.href)
  fullUrl.pathname = path
  copyToClipboard(fullUrl.toString())
}

const closeOtherTabs = (itemIdx: number) => {
  topNavMutators.deleteOtherItems(itemIdx)
  handleNavRoute()
}

/** Handle hotkeys */
const handleHotKey = (event?: HotKeyEvent) => {
  if (!event) return
  if (event.addTopNav) addNavItem()
  if (event.closeTopNav) removeNavItem(topNav.activeItemIdx.value)
  if (event.navigateTopNavLeft)
    setNavItemIdx(Math.max(topNav.activeItemIdx.value - 1, 0))
  if (event.navigateTopNavRight)
    setNavItemIdx(
      Math.min(topNav.activeItemIdx.value + 1, topNav.navState.length - 1),
    )
  if (event.jumpToTab) {
    const tabIndex = Number(event.jumpToTab.key) - 1
    if (tabIndex >= 0 && tabIndex < topNav.navState.length) {
      setNavItemIdx(tabIndex)
    }
  }
  if (event.jumpToLastTab) setNavItemIdx(topNav.navState.length - 1)
}

const addTopNavTab = (item: { name: string; uid: string }) => {
  topNavMutators.addItem(
    {
      path: item.uid,
    },
    false,
  )
}

watch(
  () => props.openNewTab,
  (openNewTab) => {
    if (openNewTab) {
      addTopNavTab(openNewTab)
    }
  },
  { immediate: true },
)

const defaultTopNavItem = computed(() => {
  return getDecoratedNavItem()
})

const mountedNavItems = computed(() => {
  return topNav.navState.map((_, i) => getDecoratedNavItem(i))
})

onMounted(() => events.hotKeys.on(handleHotKey))
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))
</script>
<template>
  <nav class="mac:pl-[72px] t-app__top-nav relative flex h-10 pl-2">
    <!-- Add a draggable overlay -->
    <div class="app-drag-region absolute inset-0" />
    <div
      class="relative flex h-10 flex-1 items-center gap-1.5 overflow-hidden pr-2.5 text-sm font-medium">
      <template v-if="topNav.navState.length === 1">
        <div class="h-full w-full overflow-hidden">
          <ScalarContextMenu
            triggerClass="flex custom-scroll gap-1.5 h-full items-center justify-center w-full whitespace-nowrap">
            <template #trigger>
              <ScalarIcon
                v-if="defaultTopNavItem?.icon"
                :icon="defaultTopNavItem?.icon"
                size="xs"
                thickness="2.5" />
              <span>{{ defaultTopNavItem?.label }}</span>
            </template>
            <template #content>
              <ScalarFloating placement="right-start">
                <template #floating>
                  <ScalarDropdownMenu class="scalar-app scalar-client">
                    <ScalarDropdownButton
                      class="flex items-center gap-1.5"
                      @click="addNavItem">
                      <ScalarIcon
                        icon="AddTab"
                        size="sm"
                        thickness="1.5" />
                      New Tab
                      <ScalarHotkey
                        class="bg-b-2 ml-auto"
                        hotkey="T" />
                    </ScalarDropdownButton>
                    <ScalarDropdownButton
                      class="flex items-center gap-1.5"
                      @click="copyUrl(topNav.activeItemIdx.value)">
                      <ScalarIcon
                        icon="Link"
                        size="sm"
                        thickness="1.5" />
                      Copy URL
                    </ScalarDropdownButton>
                  </ScalarDropdownMenu>
                </template>
              </ScalarFloating>
            </template>
          </ScalarContextMenu>
        </div>
      </template>
      <template v-else>
        <TopNavItem
          v-for="(topNavItem, index) in mountedNavItems"
          :key="topNavItem.path"
          :active="index === topNav.activeItemIdx.value"
          :hotkey="(index + 1).toString()"
          :icon="topNavItem.icon"
          :label="topNavItem.label"
          @click="setNavItemIdx(index)"
          @close="removeNavItem(index)"
          @closeOtherTabs="closeOtherTabs(index)"
          @copyUrl="copyUrl(index)"
          @newTab="addNavItem" />
      </template>
      <button
        class="text-c-3 hover:bg-b-3 app-no-drag-region rounded p-1.5"
        type="button"
        @click="addNavItem">
        <ScalarIcon
          icon="Add"
          size="xs"
          thickness="2.5" />
      </button>
    </div>
  </nav>
</template>
