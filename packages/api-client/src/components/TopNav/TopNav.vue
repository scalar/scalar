<script setup lang="ts">
import { ROUTES } from '@/constants'
import { useWorkspace } from '@/store'
import { type Icon, ScalarIcon } from '@scalar/components'
import { capitalize } from '@scalar/oas-utils/helpers'
import { computed, reactive, ref, watch } from 'vue'

import TopNavItem from './TopNavItem.vue'

const { activeRequest, router } = useWorkspace()

/** Nav Items list */
const topNavItems = reactive([{ label: '', path: '', icon: 'Add' as Icon }])
const activeNavItemIdx = ref(0)

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
  router.push(topNavItems[activeNavItemIdx.value].path)
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

const activeNavItemIdxValue = computed(() => activeNavItemIdx.value)
</script>
<template>
  <nav class="flex h-10 t-app__top-nav">
    <div class="t-app__top-nav-draggable"></div>
    <div
      class="flex h-10 flex-1 items-center justify-center gap-1.5 text-sm font-medium relative">
      <template v-if="topNavItems.length === 1">
        <div class="flex items-center gap-1 w-full justify-center">
          <ScalarIcon
            :icon="topNavItems[0].icon"
            size="xs"
            thickness="2.5" />
          <div>{{ topNavItems[0].label }}</div>
        </div>
      </template>
      <template v-else>
        <TopNavItem
          v-for="(topNavItem, index) in topNavItems"
          :key="index"
          :active="index === activeNavItemIdxValue"
          :hotkey="(index + 1).toString()"
          :icon="topNavItem.icon"
          :label="topNavItem.label"
          @click="setNavItemIdx(index)"
          @close="removeNavItem(index)">
        </TopNavItem>
      </template>
      <button
        class="text-c-3 hover:bg-b-3 p-1.5 rounded-lg webkit-app-no-drag"
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
<style scoped>
.t-app__top-nav {
  padding-left: 53px;
  padding-right: 9px;
  position: relative;
}
.t-app__top-nav-draggable {
  -webkit-app-region: drag;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.webkit-app-no-drag {
  -webkit-app-region: no-drag;
}
</style>
