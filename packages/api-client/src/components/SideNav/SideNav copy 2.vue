<script setup lang="ts">
import { ROUTES } from '@/constants'
import { useLayout } from '@/hooks'
import { useRouter } from 'vue-router'

import DownloadAppButton from './DownloadAppButton.vue'
import SideHelp from './SideHelp.vue'
import SideNavRouterLink from './SideNavRouterLink.vue'

const { currentRoute } = useRouter()
const { layout } = useLayout()
</script>
<template>
  <nav
    aria-label="App Navigation"
    class="flex items-center justify-center sm:justify-between border gap-1.5"
    :class="layout === 'web' ? 'h-12' : 'sm:w-13 sm:flex-col px-2 py-2'"
    role="navigation">
    <ul
      class="flex gap-1.5"
      :class="layout === 'web' ? 'sm:gap-px sm:px-2' : 'sm:flex-col'">
      <li
        v-for="({ icon, name, prettyName }, i) in ROUTES.filter(
          (route) => route.name !== 'settings',
        )"
        :key="i">
        <SideNavRouterLink
          :active="(currentRoute.name as string | undefined)?.startsWith(name)"
          :icon="icon"
          :name="name">
          {{ prettyName }}
        </SideNavRouterLink>
      </li>
    </ul>
    <ul
      class="flex items-center"
      :class="layout === 'web' ? 'gap-px px-2' : 'gap-1.5 sm:flex-col'">
      <li class="flex items-center">
        <SideNavRouterLink
          :active="currentRoute.name === 'settings'"
          icon="Settings"
          name="settings">
          Settings
        </SideNavRouterLink>
      </li>
      <li class="flex items-center">
        <SideHelp />
      </li>
      <li
        v-if="layout !== 'desktop'"
        class="ml-2">
        <DownloadAppButton />
      </li>
    </ul>
  </nav>
</template>
