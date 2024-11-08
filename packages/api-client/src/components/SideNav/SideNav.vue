<script setup lang="ts">
import { ROUTES } from '@/constants'
import { useLayout } from '@/hooks'
import { useRouter } from 'vue-router'

import DownloadAppButton from './DownloadAppButton.vue'
import SideHelp from './SideHelp.vue'
import SideNavGroup from './SideNavGroup.vue'
import SideNavRouterLink from './SideNavRouterLink.vue'

const { currentRoute } = useRouter()
const { layout } = useLayout()
</script>
<template>
  <nav
    aria-label="App Navigation"
    class="flex items-center justify-center sm:justify-between gap-1.5"
    :class="layout === 'web' ? 'border h-12' : 'sm:flex-col px-2 py-2'"
    role="navigation">
    <SideNavGroup class="flex gap-1.5">
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
    </SideNavGroup>
    <SideNavGroup>
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
        class="hidden sm:block sm:ml-2">
        <DownloadAppButton />
      </li>
    </SideNavGroup>
  </nav>
</template>
