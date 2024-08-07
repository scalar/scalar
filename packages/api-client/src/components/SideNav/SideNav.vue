<script setup lang="ts">
import DarkModeIconToggle from '@/components/DarkModeToggle/DarkModeIconToggle.vue'
import { ROUTES } from '@/constants'
import { useRouter } from 'vue-router'

import SideHelp from './SideHelp.vue'
import SideNavLink from './SideNavLink.vue'
import WorkspaceProfileIcon from './WorkspaceProfileIcon.vue'

const { currentRoute } = useRouter()
</script>
<template>
  <nav
    aria-label="Side Navigation"
    class="text-c-2 w-15 flex flex-col items-center px-2 py-2 scalar-sidenav relative drag-region"
    role="navigation">
    <WorkspaceProfileIcon class="no-drag-region" />
    <ul class="mt-3.5 flex flex-col gap-1.5">
      <li
        v-for="({ icon, name, prettyName }, i) in ROUTES"
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
    <ul class="mt-auto flex flex-col py-1.5">
      <li class="flex items-center no-drag-region">
        <SideHelp />
      </li>
      <li class="flex items-center no-drag-region">
        <DarkModeIconToggle />
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
