<script setup lang="ts">
import { TheCommandPalette } from '@/components/CommandPalette'
import SideNav from '@/components/SideNav/SideNav.vue'
</script>
<template>
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main class="flex flex-col sm:flex-row min-h-0 flex-1">
    <SideNav class="order-last sm:order-none" />

    <!-- Popup command palette to add resources from anywhere -->
    <TheCommandPalette />

    <div class="flex flex-1 flex-col min-w-0 min-h-0 border-l-1/2 border-t-1/2">
      <slot />
    </div>
  </main>
</template>
