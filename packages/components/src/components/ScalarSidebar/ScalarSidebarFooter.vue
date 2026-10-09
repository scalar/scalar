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
import { makePoweredByUrl } from '@scalar/helpers/url/make-powered-by-url'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarColorModeToggle } from '../ScalarColorModeToggle'

defineSlots<{
  /** Footer content at the top of the footer */
  default?(): unknown
  /** Replaces the Powered by Scalar link */
  description?(): unknown
  /** Replaces the color mode toggle */
  toggle?(): unknown
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

/** The footer does not know the integration, so the link goes out without a campaign */
const poweredByUrl = makePoweredByUrl()
</script>
<template>
  <div v-bind="cx('flex flex-col gap-3 px-3 pb-3 border-sidebar-border')">
    <slot />
    <div class="flex items-center">
      <div class="flex-1 min-w-0 flex items-center text-sm text-sidebar-c-2">
        <slot name="description">
          <a
            class="no-underline hover:underline"
            :href="poweredByUrl"
            rel="noopener"
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
