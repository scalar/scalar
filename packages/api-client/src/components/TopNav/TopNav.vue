<script setup lang="ts">
import { useTopNav } from '@/store/topNav'
import { ScalarIcon } from '@scalar/components'
import { computed } from 'vue'

import TopNavItem from './TopNavItem.vue'

const {
  topNavItems,
  addNavItem,
  activeNavItemIdx,
  setNavItemIdx,
  removeNavItem,
} = useTopNav()

const activeNavItemIdxValue = computed(() => activeNavItemIdx.value)
</script>
<template>
  <nav class="flex h-10 t-app__top-nav">
    <div
      class="flex h-10 flex-1 items-center justify-center gap-1.5 text-sm font-medium">
      <template v-if="topNavItems.length === 1">
        <div class="flex items-center gap-1 w-full justify-center">
          <ScalarIcon
            class="stroke-[2]"
            :icon="topNavItems[0].icon"
            size="xs" />
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
        class="text-c-3 hover:bg-b-2 p-1.5 rounded-lg"
        type="button"
        @click="addNavItem">
        <ScalarIcon
          icon="Add"
          size="xs" />
      </button>
    </div>
  </nav>
</template>
<style scoped>
.t-app__top-nav {
  padding-left: 53px;
  padding-right: 9px;
}
</style>
