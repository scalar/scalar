<script setup lang="ts">
import { TheCommandPalette } from '@/components/CommandPalette'
import SideNav from '@/components/SideNav/SideNav.vue'
import { useLayout } from '@/hooks'

const { layout } = useLayout()
</script>
<template>
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main
    class="flex min-h-0 flex-1 flex-col"
    :class="layout === 'web' ? 'sm:flex-col' : 'sm:flex-row'">
    <SideNav class="sidenav order-last sm:order-none" />

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
