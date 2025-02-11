<script setup lang="ts">
import SideNavGroup from '@/components/SideNav/SideNavGroup.vue'
import SideNavRouterLink from '@/components/SideNav/SideNavRouterLink.vue'
import { useLayout } from '@/hooks'
import type { Icon } from '@scalar/components'
import {
  type RouteLocationNamedRaw,
  type RouteLocationOptions,
  type RouteLocationRaw,
  useRouter,
} from 'vue-router'

const { currentRoute } = useRouter()
const { layout } = useLayout()

type CollectionSidebarEntry = {
  icon: Icon
  to: RouteLocationNamedRaw
  displayName: string
}

const routes: CollectionSidebarEntry[] = [
  {
    icon: 'Settings',
    to: {
      name: 'collection',
    },
    displayName: 'Info',
  },
] as const
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
      <li
        v-for="({ icon, to, displayName }, i) in routes"
        :key="i">
        <SideNavRouterLink
          :active="
            typeof to.name === 'string' &&
            typeof currentRoute.name === 'string' &&
            currentRoute.name?.startsWith(to.name)
          "
          :icon="icon"
          :to="to">
          {{ displayName }}
        </SideNavRouterLink>
      </li>
    </SideNavGroup>
  </nav>
</template>
