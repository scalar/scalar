<script setup lang="ts">
import { ROUTES } from '@/constants'
import { useRouter } from 'vue-router'

import SideNavLink from './SideNavLink.vue'
import WorkspaceProfileIcon from './WorkspaceProfileIcon.vue'

const { currentRoute } = useRouter()
</script>
<template>
  <nav
    aria-label="Side Navigation"
    class="text-c-2 w-15 flex items-center scalar-sidenav relative no-drag-region mr-4"
    role="navigation">
    <!-- <WorkspaceProfileIcon class="no-drag-region" /> -->
    <ul class="flex gap-1.5">
      <li
        v-for="({ icon, name, prettyName }, i) in ROUTES"
        :key="i">
        <SideNavLink
          :active="(currentRoute.name as string | undefined)?.startsWith(name)"
          :icon="icon"
          :name="name"
          :prettyName="prettyName">
          {{ name }}
        </SideNavLink>
      </li>
    </ul>
  </nav>
</template>
<style scoped>
/** Clickable items must not be draggable, though */
.no-drag-region {
  -webkit-app-region: no-drag;
}
</style>
