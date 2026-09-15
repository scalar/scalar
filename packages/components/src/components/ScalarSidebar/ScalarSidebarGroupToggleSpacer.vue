<script lang="ts">
/**
 * Scalar Sidebar Group Toggle Spacer component
 *
 * Reserves room at the end of a discrete group label for the
 * ScalarSidebarGroupToggleButton, which is positioned on top of the label
 * and therefore takes up no space of its own.
 *
 * Render it in the label's aside slot so long labels wrap before they run
 * underneath the toggle button.
 *
 * @see ScalarSidebarGroupToggleButton
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('size-4')" />
</template>
