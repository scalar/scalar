<script lang="ts">
/**
 * Main entry point for the API client for electron and web
 *
 * This will be the brains of the client, should handle all events and store business logic
 */
export default {}
</script>

<script setup lang="ts">
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { RouterView } from 'vue-router'

import type { ClientLayout } from '@/v2/types/layout'

const { layout } = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  workspaceStore: WorkspaceStore
}>()
</script>

<template>
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main class="flex min-h-0 flex-1 flex-col">
    <!-- Insert new sidebar here -->
    <!-- <SideNav class="sidenav order-last sm:order-none" /> -->

    <!-- Popup command palette to add resources from anywhere -->
    <!-- <TheCommandPalette /> -->

    <!-- <ImportCollectionListener></ImportCollectionListener> -->

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <RouterView v-slot="{ Component }">
        <keep-alive>
          <component
            :is="Component"
            :layout="layout" />
        </keep-alive>
      </RouterView>
    </div>
  </main>
</template>
