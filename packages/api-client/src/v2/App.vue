<script lang="ts">
/**
 * Main entry point for the API client for all layouts
 *
 * Previously we had a separate entry point for each layout
 */
export default {}
</script>

<script setup lang="ts">
import type { ClientLayout } from '@/v2/helpers/create-api-client'

const { layout } = defineProps<{
  layout: ClientLayout
}>()
</script>

<template>
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main
    class="flex min-h-0 flex-1 flex-col"
    :class="layout === 'web' ? 'sm:flex-col' : 'sm:flex-row'">
    <!-- Insert new sidebar here -->
    <!-- <SideNav class="sidenav order-last sm:order-none" /> -->

    <!-- Popup command palette to add resources from anywhere -->
    <TheCommandPalette />

    <div
      class="flex min-h-0 min-w-0 flex-1 flex-col"
      :class="{
        'border sm:mr-1.5 sm:mb-1.5 sm:rounded-lg sm:*:rounded-lg':
          layout === 'desktop',
      }">
      <slot />
    </div>
  </main>
</template>
