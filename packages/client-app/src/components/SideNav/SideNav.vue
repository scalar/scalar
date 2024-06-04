<script setup lang="ts">
import DarkModeIconToggle from '@/components/DarkModeToggle/DarkModeIconToggle.vue'
import { ROUTES, themeClasses } from '@/constants'
import { useRouter } from 'vue-router'

import SideNavLink from './SideNavLink.vue'
import WorkspaceProfileIcon from './WorkspaceProfileIcon.vue'

const { currentRoute } = useRouter()
</script>
<template>
  <nav
    aria-label="Side Navigation"
    class="text-c-2 w-15 flex flex-col items-center px-2 py-2"
    :class="[themeClasses.sideNav]"
    role="navigation">
    <WorkspaceProfileIcon />
    <ul class="mt-3.5 flex flex-col gap-1.5">
      <li
        v-for="({ icon, label, path }, i) in ROUTES"
        :key="i">
        <SideNavLink
          :active="currentRoute.path.startsWith(path)"
          :icon="icon"
          :path="path">
          {{ label }}
        </SideNavLink>
      </li>
    </ul>
    <ul class="mt-auto flex flex-col gap-2 py-1.5">
      <li class="flex items-center">
        <DarkModeIconToggle />
      </li>
    </ul>
  </nav>
</template>
