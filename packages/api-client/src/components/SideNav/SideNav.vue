<script setup lang="ts">
import { ROUTES } from '@/constants'
import { ScalarIcon } from '@scalar/components'
import { useRouter } from 'vue-router'

import SideHelp from './SideHelp.vue'
import SideNavLink from './SideNavLink.vue'

const { currentRoute } = useRouter()
</script>
<template>
  <nav
    aria-label="App Navigation"
    class="text-c-2 sm:w-13 flex sm:flex-col justify-center items-center px-2 py-2 scalar-sidenav relative drag-region bg-b-1 group-sidenav"
    role="navigation">
    <ul class="flex sm:flex-col gap-1.5">
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
    <ul class="mt-auto flex sm:flex-col gap-1.5 py-0.5">
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
      <li class="hide-in-scalar-app">
        <a
          class="min-w-[37px] max-w-[37px] hover:bg-b-2 flex items-center justify-center rounded-lg p-[8px] text-c-3 focus:text-c-1 scalar-app-nav-padding group-hover/sidenav:border-1/2 group-sidenav-hover cursor-pointer"
          href="https://scalar.com/download"
          target="_blank">
          <ScalarIcon
            icon="Download"
            thickness="1.5" />
        </a>
      </li>
    </ul>
  </nav>
</template>
<style scoped>
/** Make the sidebar draggable */
.drag-region {
  -webkit-app-region: drag;
}

/** Clickable items must not be draggable, though */
.no-drag-region {
  -webkit-app-region: no-drag;
}

.group-sidenav:hover .group-sidenav-hover {
  box-shadow: 0 0 0 0.5px var(--scalar-border-color);
  background: linear-gradient(rgba(255, 255, 255, 0.75), rgba(0, 0, 0, 0.035));
}
.dark-mode .group-sidenav:hover .group-sidenav-hover {
  background: linear-gradient(rgba(255, 255, 255, 0.035), rgba(0, 0, 0, 0.15));
}
.group-sidenav .group-sidenav-hover:hover {
  background: linear-gradient(rgba(0, 0, 0, 0.035), rgba(255, 255, 255, 0.75));
}
.dark-mode .group-sidenav .group-sidenav-hover:hover {
  background: linear-gradient(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.035));
}
</style>
