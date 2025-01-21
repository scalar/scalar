<script setup lang="ts">
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { ROUTES } from '@/constants'
import type { HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  type Icon,
  ScalarContextMenu,
  ScalarDropdownButton,
  ScalarDropdownMenu,
  ScalarFloating,
  ScalarIcon,
} from '@scalar/components'
import { capitalize } from '@scalar/oas-utils/helpers'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import TopNavItem from './TopNavItem.vue'

const props = defineProps<{
  openNewTab: { name: string; uid: string } | null
}>()
const { activeRequest } = useActiveEntities()
const router = useRouter()
const { events } = useWorkspace()
const { copyToClipboard } = useClipboard()

/** Nav Items list */
const topNavItems = reactive([{ label: '', path: '', icon: 'Add' as Icon }])
const activeNavItemIdx = ref(0)
const activeNavItemIdxValue = computed(() => activeNavItemIdx.value)

/**
 * Logic to handle adding a nav item
 * based on the current route
 */
function handleNavLabelAdd() {
  const activeRoute = ROUTES.find((route) => {
    return router.currentRoute.value.name == route.name
  })

  if (!activeRoute) return

  // if it's a request we can push in a request
  if (activeRoute?.name === 'request') {
    topNavItems[activeNavItemIdx.value] = {
      label: activeRequest.value?.summary || '',
      path: router.currentRoute.value.path,
      icon: activeRoute.icon,
    }
  } else {
    // not requests so its the other nav items
    // we can eventually be more granular
    topNavItems[activeNavItemIdx.value] = {
      label: capitalize(activeRoute?.name) || '',
      path: router.currentRoute.value.path,
      icon: activeRoute.icon,
    }
  }
}

function handleNavRoute() {
  const path = topNavItems[activeNavItemIdx.value]?.path
  if (path) {
    router.push(path)
  }
}

/**
 * adding a nav item sets the new index and nav item
 * based on the route
 */
function addNavItem() {
  topNavItems.push({ label: '', path: '', icon: 'Add' })
  activeNavItemIdx.value = topNavItems.length - 1
  handleNavLabelAdd()
}

function setNavItemIdx(idx: number) {
  activeNavItemIdx.value = idx
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

function removeNavItem(idx: number) {
  topNavItems.splice(idx, 1)
  activeNavItemIdx.value = Math.min(
    activeNavItemIdx.value,
    topNavItems.length - 1,
  )
  handleNavRoute()
}

const copyUrl = (idx: number) => {
  if (!topNavItems[idx]?.path) return

  const fullUrl = new URL(window.location.href)
  fullUrl.pathname = topNavItems[idx].path
  copyToClipboard(fullUrl.toString())
}

const closeOtherTabs = (idx: number) => {
  topNavItems.splice(0, idx)
  topNavItems.splice(1)
  activeNavItemIdx.value = 0
  handleNavRoute()
}

/** Handle hotkeys */
const handleHotKey = (event?: HotKeyEvent) => {
  if (!event) return
  if (event.addTopNav) addNavItem()
  if (event.closeTopNav) removeNavItem(activeNavItemIdx.value)
  if (event.navigateTopNavLeft)
    setNavItemIdx(Math.max(activeNavItemIdx.value - 1, 0))
  if (event.navigateTopNavRight)
    setNavItemIdx(Math.min(activeNavItemIdx.value + 1, topNavItems.length - 1))
  if (event.jumpToTab) {
    const tabIndex = Number(event.jumpToTab.key) - 1
    if (tabIndex >= 0 && tabIndex < topNavItems.length) {
      setNavItemIdx(tabIndex)
    }
  }
  if (event.jumpToLastTab) setNavItemIdx(topNavItems.length - 1)
}

const addTopNavTab = (item: { name: string; uid: string }) => {
  topNavItems.push({
    label: item.name,
    path: item.uid,
    icon: 'ExternalLink',
  })
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

onMounted(() => events.hotKeys.on(handleHotKey))
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))
</script>
<template>
  <nav class="flex relative h-10 pl-2 mac:pl-[72px] t-app__top-nav">
    <!-- Add a draggable overlay -->
    <div class="absolute inset-0 app-drag-region" />
    <div
      class="flex h-10 flex-1 items-center gap-1.5 text-sm font-medium pr-2.5 relative overflow-hidden">
      <template v-if="topNavItems.length === 1">
        <div class="h-full w-full overflow-hidden">
          <ScalarContextMenu
            triggerClass="flex custom-scroll gap-1.5 h-full items-center justify-center w-full whitespace-nowrap">
            <template #trigger>
              <ScalarIcon
                :icon="topNavItems[0]?.icon"
                size="xs"
                thickness="2.5" />
              <span>{{ topNavItems[0]?.label }}</span>
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
                      @click="copyUrl(activeNavItemIdxValue)">
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
          v-for="(topNavItem, index) in topNavItems"
          :key="topNavItem.path"
          :active="index === activeNavItemIdxValue"
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
        class="text-c-3 hover:bg-b-3 p-1.5 rounded app-no-drag-region"
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
