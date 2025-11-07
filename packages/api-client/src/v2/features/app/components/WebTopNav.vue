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
import type { Workspace } from '@/v2/hooks/use-workspace-selector'

import DownloadAppButton from './DownloadAppButton.vue'

defineProps<{
  activeWorkspace: Workspace
  workspaces: Workspace[]
}>()

const emit = defineEmits<{
  /** Emitted when the user wants to create a new workspace */
  (e: 'createWorkspace'): void
  /** Emitted when the user selects a workspace */
  (e: 'select:workspace', id?: string): void
}>()
</script>

<template>
  <nav class="flex h-12 items-center justify-between border-b p-2">
    <SidebarMenu
      :activeWorkspace="activeWorkspace"
      :workspaces="workspaces"
      @createWorkspace="emit('createWorkspace')"
      @select:workspace="(id) => emit('select:workspace', id)" />
    <DownloadAppButton />
  </nav>
</template>
