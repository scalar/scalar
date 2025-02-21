<script setup lang="ts">
import { ROUTES } from '@/constants'
import { useLayout } from '@/hooks'
import { PathId } from '@/routes'
import { useActiveEntities } from '@/store'
import { ScalarIcon } from '@scalar/components'
import { useRouter } from 'vue-router'

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
    class="flex items-center justify-center sm:justify-between gap-1.5 app-drag-region pt-2"
    :class="
      layout === 'web' ? 'border h-header !pt-0' : 'sm:flex-col px-2 pb-2'
    "
    role="navigation">
    <SideNavGroup class="app-no-drag-region">
      <a
        class="hidden items-center mr-3 ml-1"
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
              (currentRoute.name as string | undefined)?.startsWith(to.name),
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
          :active="currentRoute.name === 'settings.default'"
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
        class="hidden sm:ml-1.5 sm:flex items-center justify-center">
        <DownloadAppButton />
      </li>
    </SideNavGroup>
  </nav>
</template>
