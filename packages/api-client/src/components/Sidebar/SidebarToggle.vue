<script setup lang="ts">
import { useSidebar } from '@/hooks/useSidebar'

const { isSidebarOpen, toggleSidebarOpen } = useSidebar()
</script>
<template>
  <button
    :aria-pressed="isSidebarOpen"
    class="scalar-sidebar-toggle text-c-3 hover:bg-b-2 active:text-c-1 rounded-lg p-2"
    type="button"
    @click="toggleSidebarOpen">
    <span class="sr-only">{{ isSidebarOpen ? 'Hide' : 'Show' }} sidebar</span>
    <svg
      class="size-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="mask">
          <path
            clip-rule="evenodd"
            d="M9 3.2H4c-1.7 0-3 1.3-3 3v11.5c0 1.7 1.3 3 3 3h5V3.2z" />
        </clipPath>
      </defs>
      <g clip-path="url(#mask)">
        <path
          class="transition-transform duration-300"
          :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-1/2'"
          d="M1 3.2h8v17.5H1z"
          fill="currentColor" />
      </g>
      <path
        d="M20 20.8H4c-1.7 0-3-1.3-3-3V6.2c0-1.7 1.3-3 3-3h16c1.7 0 3 1.3 3 3v11.5c0 1.7-1.3 3-3 3zM9 3.2v17.5"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2" />
    </svg>
  </button>
</template>
