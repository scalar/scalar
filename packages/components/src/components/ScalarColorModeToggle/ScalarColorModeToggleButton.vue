<script lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type ScalarColorModeToggle from './ScalarColorModeToggle.vue'
import ScalarColorModeToggleIcon from './ScalarColorModeToggleIcon.vue'

/**
 * Scalar Color Mode Toggle Button component
 *
 * A dumb button that toggles between a sun and moon icon.
 *
 * If you need a toggle that is aware of and sets color mode,
 * you want {@link ScalarColorModeToggle} instead.
 *
 * @example
 *   <ScalarColorModeToggleButton v-model="isDarkMode" />
 */
export default {}
</script>
<script lang="ts" setup>
defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

/** Whether the toggle is in dark mode */
const model = defineModel<boolean>()
</script>
<template>
  <button
    :aria-pressed="model"
    type="button"
    v-bind="
      cx(
        'group/toggle flex h-6 w-[38px] brightness-lifted -mx-px items-center py-1.5 -my-1.5 relative outline-none',
      )
    "
    @click="model = !model">
    <!-- Background -->
    <div
      class="h-3 w-full bg-border mx-px rounded-xl group-focus-visible/toggle:outline -outline-offset-1" />
    <!-- Slider -->
    <div
      class="size-[23px] left-border absolute border rounded-full flex items-center justify-center bg-b-1 group-focus-visible/toggle:outline -outline-offset-1 transition-transform duration-300 ease-in-out"
      :class="{ 'translate-x-[14px]': model }">
      <!-- Icon -->
      <ScalarColorModeToggleIcon
        is="div"
        :mode="model ? 'dark' : 'light'" />
    </div>
  </button>
</template>
