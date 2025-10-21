<script lang="ts">
/**
 * The top nav on the web
 *
 * This no longer contains the links to cookies and environment but just holds the menu and download buttons
 */
export default {}
</script>

<script setup lang="ts">
import DownloadAppButton from './DownloadAppButton.vue'
import SidebarWorkspaceMenu from './SidebarWorkspaceMenu.vue'

const workspaceModel = defineModel<string>({
  required: true,
  default: 'default',
})
</script>

<template>
  <nav class="flex items-center justify-between border-b p-2">
    <SidebarWorkspaceMenu v-model="workspaceModel" />
    <DownloadAppButton />
  </nav>
</template>
