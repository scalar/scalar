<script lang="ts">
/**
 * Scalar Sidebar Footer component
 *
 * A footer for the sidebar, be default it contains a
 * "Powered by Scalar" link and a {@link ScalarColorModeToggle} toggle.
 *
 * @example
 *   <ScalarSidebarFooter>
 *     <!-- Footer content at the top of the footer -->
 *     <template #description>
 *       <!-- Replaces the Powered by Scalar link -->
 *     </template>
 *     <template #toggle>
 *       <!-- Replaces the color mode toggle -->
 *     </template>
 *   </ScalarSidebarFooter>
 */
export default {}
</script>
<script lang="ts" setup>
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarColorModeToggle } from '../ScalarColorModeToggle'

defineSlots<{
  /** Footer content at the top of the footer */
  default: () => any
  /** Replaces the Powered by Scalar link */
  description: () => any
  /** Replaces the color mode toggle */
  toggle: () => any
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex flex-col gap-3 p-3 border-t')">
    <slot />
    <div class="flex items-center">
      <div class="flex-1 min-w-0 flex items-center text-sm text-sidebar-c-2">
        <slot name="description">
          <a
            class="no-underline hover:underline"
            href="https://www.scalar.com"
            target="_blank">
            Powered by Scalar
          </a>
        </slot>
      </div>
      <slot name="toggle">
        <ScalarColorModeToggle />
      </slot>
    </div>
  </div>
</template>
