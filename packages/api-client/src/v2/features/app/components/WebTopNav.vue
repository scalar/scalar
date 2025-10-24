<script lang="ts">
/**
 * The top nav on the web
 *
 * This no longer contains the links to cookies and environment but just holds the menu and download buttons
 */
export default {}
</script>

<script setup lang="ts">
import { SidebarMenu } from '@/v2/components/sidebar'

import DownloadAppButton from './DownloadAppButton.vue'

const workspaceModel = defineModel<string>({
  required: true,
  default: 'default',
})
</script>

<template>
  <nav class="flex h-12 items-center justify-between border-b p-2">
    <SidebarMenu v-model:workspace="workspaceModel" />
    <DownloadAppButton />
  </nav>
</template>
