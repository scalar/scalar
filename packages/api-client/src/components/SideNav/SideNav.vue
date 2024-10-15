<script setup lang="ts">
import { ROUTES } from '@/constants'
import { useRouter } from 'vue-router'

import SideHelp from './SideHelp.vue'
import SideNavLink from './SideNavLink.vue'

const { currentRoute } = useRouter()
</script>
<template>
  <nav
    aria-label="Side Navigation"
    class="text-c-2 w-15 flex flex-col items-center px-2 py-2 scalar-sidenav relative drag-region bg-b-1 border-t-1/2"
    role="navigation">
    <ul class="flex flex-col gap-1.5">
      <li
        v-for="({ icon, name, prettyName }, i) in ROUTES.filter(
          (route) => route.name !== 'settings',
        )"
        :key="i"
        class="no-drag-region">
        <SideNavLink
          :active="(currentRoute.name as string | undefined)?.startsWith(name)"
          :icon="icon"
          :name="name"
          :prettyName="prettyName">
          {{ name }}
        </SideNavLink>
      </li>
    </ul>
    <ul class="mt-auto flex flex-col gap-1.5 py-0.5">
      <li class="flex items-center no-drag-region">
        <SideNavLink
          :active="currentRoute.name === 'settings'"
          icon="Settings"
          name="settings"
          prettyName="Settings">
          Settings
        </SideNavLink>
      </li>
      <li class="flex items-center no-drag-region">
        <SideHelp />
      </li>
    </ul>
  </nav>
</template>
<style scoped>
.scalar-sidenav {
  width: 52px;
}

/** Make the sidebar draggable */
.drag-region {
  -webkit-app-region: drag;
}

/** Clickable items must not be draggable, though */
.no-drag-region {
  -webkit-app-region: no-drag;
}
</style>
