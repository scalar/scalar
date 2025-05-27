<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { useRouter } from 'vue-router'

import { ROUTES } from '@/constants'
import { useLayout } from '@/hooks'
import { PathId } from '@/routes'
import { useActiveEntities } from '@/store'

import DownloadAppButton from './DownloadAppButton.vue'
import SideHelp from './SideHelp.vue'
import SideNavGroup from './SideNavGroup.vue'
import SideNavRouterLink from './SideNavRouterLink.vue'

const { currentRoute } = useRouter()
const { layout } = useLayout()

const { activeWorkspace } = useActiveEntities()
</script>
<template>
  <nav
    aria-label="App Navigation"
    class="app-drag-region flex items-center justify-center gap-1.5 pt-2 sm:justify-between"
    :class="
      layout === 'web' ? 'h-header border !pt-0' : 'px-2 pb-2 sm:flex-col'
    "
    role="navigation">
    <SideNavGroup class="app-no-drag-region">
      <a
        class="mr-3 ml-1 hidden items-center"
        :class="{
          'sm:flex': layout === 'web',
        }"
        href="https://www.scalar.com"
        target="_blank">
        <ScalarIcon
          icon="Logo"
          size="xl" />
      </a>
      <!-- Everything, but settings -->
      <li
        v-for="({ icon, to, displayName }, i) in ROUTES.filter(
          (route) => route.to.name !== 'settings.default',
        )"
        :key="i">
        <SideNavRouterLink
          :active="
            Boolean(
              currentRoute.name === displayName.toLowerCase() ||
                (displayName.toLowerCase() === 'environment' &&
                  currentRoute.name === 'environment.collection'),
            )
          "
          :icon="icon"
          :to="{
            ...to,
            params: {
              [PathId.Workspace]: activeWorkspace?.uid ?? 'default',
            },
          }">
          {{ displayName }}
        </SideNavRouterLink>
      </li>
    </SideNavGroup>
    <!-- Pinned to the bottom -->
    <SideNavGroup class="app-no-drag-region">
      <li class="flex items-center">
        <SideNavRouterLink
          :active="currentRoute.name === 'settings'"
          icon="Settings"
          :to="{
            name: `settings.default`,
            params: {
              [PathId.Workspace]: activeWorkspace?.uid,
            },
          }">
          Settings
        </SideNavRouterLink>
      </li>
      <li class="flex items-center">
        <SideHelp />
      </li>
      <li
        v-if="layout !== 'desktop'"
        class="hidden items-center justify-center sm:ml-1.5 sm:flex">
        <DownloadAppButton />
      </li>
    </SideNavGroup>
  </nav>
</template>
