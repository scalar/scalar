<script setup lang="ts">
import SideNavLink from '@/components/SideNav/SideNavLink.vue'
import { useLayout } from '@/hooks'
import { ScalarIcon } from '@scalar/components'

const { layout } = useLayout()
</script>
<template>
  <SideNavLink
    class="download-app-button sm:px-3"
    href="https://scalar.com/download"
    icon="Download"
    target="_blank">
    <template #icon>
      <ScalarIcon
        class="sm:size-4 sm:mr-2"
        icon="Download"
        thickness="2" />
    </template>
    <span
      class="text-sm font-medium sr-only"
      :class="{ 'sm:not-sr-only': layout === 'web' }">
      Download App
    </span>
  </SideNavLink>
</template>
<style scoped>
.download-app-button {
  box-shadow: 0 0 0 0.5px var(--scalar-border-color);
  background: linear-gradient(rgba(255, 255, 255, 0.75), rgba(0, 0, 0, 0.035));
}

.dark-mode .download-app-button {
  background: linear-gradient(rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.15));
}

.download-app-button:hover {
  background: linear-gradient(rgba(0, 0, 0, 0.035), rgba(255, 255, 255, 0.75));
}

.dark-mode .download-app-button:hover {
  background: linear-gradient(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.1));
}
</style>
