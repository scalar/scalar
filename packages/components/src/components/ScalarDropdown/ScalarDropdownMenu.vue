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
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

import { ScalarFloatingBackdrop } from '../ScalarFloating'

defineProps<{
  /** The component to render */
  is?: string | Component
}>()

defineSlots<{
  /** The menu contents */
  default(): any
  /** Overrides the backdrop for the dropdown */
  backdrop?(): any
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <!-- Background container -->
  <component
    :is="is ?? 'div'"
    role="menu"
    tabindex="0"
    v-bind="cx('relative flex w-56')">
    <!-- Scroll container -->
    <div class="custom-scroll min-h-0 flex-1">
      <!-- Menu items -->
      <div class="flex flex-col p-0.75">
        <slot />
      </div>
      <slot name="backdrop">
        <ScalarFloatingBackdrop />
      </slot>
    </div>
  </component>
</template>
