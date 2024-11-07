<script setup lang="ts">
import { TheCommandPalette } from '@/components/CommandPalette'
import SideNav from '@/components/SideNav/SideNav.vue'
</script>
<template>
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main class="flex flex-col sm:flex-row min-h-0 flex-1 web-layout">
    <SideNav class="order-last sm:order-none web-layout-sidebar" />

    <!-- Popup command palette to add resources from anywhere -->
    <TheCommandPalette />

    <div class="flex flex-1 flex-col min-w-0 min-h-0 app-layout">
      <slot />
    </div>
  </main>
</template>
