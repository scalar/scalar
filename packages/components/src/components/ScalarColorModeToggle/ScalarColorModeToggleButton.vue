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
      class="bg-border mx-px h-3 w-full rounded-xl -outline-offset-1 group-focus-visible/toggle:outline" />
    <!-- Slider -->
    <div
      class="left-border bg-b-1 absolute flex size-[23px] items-center justify-center rounded-full border -outline-offset-1 transition-transform duration-300 ease-in-out group-focus-visible/toggle:outline"
      :class="{ 'translate-x-[14px]': model }">
      <!-- Icon -->
      <ScalarColorModeToggleIcon
        is="div"
        :mode="model ? 'dark' : 'light'" />
    </div>
  </button>
</template>
