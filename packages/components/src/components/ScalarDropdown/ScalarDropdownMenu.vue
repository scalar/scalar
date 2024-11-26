<script lang="ts">
/**
 * Scalar dropdown menu component
 *
 * Provides a scrollable container for dropdown items
 * This is used internally by the ScalarDropdown component
 *
 * If you're looking to create a dropdown menu with a trigger
 * button you probably want the ScalarDropdown component
 *
 * @example
 * <ScalarDropdownMenu>
 *   <ScalarDropdownItem>Item 1</ScalarDropdownItem>
 *   <ScalarDropdownItem>Item 2</ScalarDropdownItem>
 * </ScalarDropdownMenu>
 */
export default {}
</script>
<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  /** The component to render */
  is?: string | Component
}>()
</script>
<template>
  <!-- Background container -->
  <component
    :is="is ?? 'div'"
    class="relative flex w-56 rounded border"
    role="menu"
    tabindex="0">
    <!-- Scroll container -->
    <div class="custom-scroll min-h-0 flex-1">
      <!-- Menu items -->
      <div class="flex flex-col p-0.75">
        <slot />
      </div>
      <div
        class="absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted" />
    </div>
  </component>
</template>
