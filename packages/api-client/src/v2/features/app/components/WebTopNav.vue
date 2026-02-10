<script lang="ts">
/**
 * The top nav on the web
 *
 * This no longer contains the links to cookies and environment but just holds the menu and download buttons
 */
export default {}
</script>

<script setup lang="ts">
import type { WorkspaceGroup } from '@scalar/components'

import { SidebarMenu } from '@/v2/components/sidebar'

import DownloadAppButton from './DownloadAppButton.vue'

defineProps<{
  /**
   * The currently active workspace.
   * This represents the workspace that the user is currently working in.
   */
  activeWorkspace: { id: string }
  /**
   * The list of all available workspaces.
   * Used to render options for workspace switching and selection.
   */
  workspaces: WorkspaceGroup[]
}>()

const emit = defineEmits<{
  /** Emitted when the user wants to create a new workspace */
  (e: 'create:workspace'): void
  /** Emitted when the user selects a workspace */
  (e: 'select:workspace', id?: string): void
}>()
</script>

<template>
  <nav class="flex h-12 items-center justify-between border-b p-2">
    <SidebarMenu
      :activeWorkspace="activeWorkspace"
      :workspaces="workspaces"
      @create:workspace="emit('create:workspace')"
      @select:workspace="(id) => emit('select:workspace', id)" />
    <DownloadAppButton />
  </nav>
</template>
