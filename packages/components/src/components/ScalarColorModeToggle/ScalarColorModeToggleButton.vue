<script lang="ts">
import { useBindCx } from '../../hooks/useBindCx'
import type ScalarColorModeToggle from './ScalarColorModeToggle.vue'

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
    aria-label="Toggle dark mode"
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
      <div
        class="size-3 flex items-center justify-center"
        :class="model ? 'toggle-icon-moon' : 'toggle-icon-sun'">
        <span class="toggle-icon-sun-ray" />
        <span class="toggle-icon-sun-ray" />
        <span class="toggle-icon-sun-ray" />
        <span class="toggle-icon-sun-ray" />
        <span class="toggle-icon-ellipse">
          <span class="toggle-icon-moon-mask" />
        </span>
      </div>
    </div>
  </button>
</template>
<style scoped>
.toggle-icon-ellipse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--scalar-color-1);
  overflow: hidden;
  position: relative;
  background: var(--scalar-background-1);
  display: inline-block;
  transition:
    width 0.3s ease-in-out,
    height 0.3s ease-in-out;
}
.toggle-icon-moon-mask {
  width: 100%;
  height: 100%;
  border: 1px solid var(--scalar-color-1);
  display: block;
  left: 2.5px;
  bottom: 2.5px;
  position: absolute;
  border-radius: 50%;
  background: var(--scalar-background-1);
  transition: transform 0.3s ease-in-out;
  transform: translate3d(4px, -4px, 0);
}
.toggle-icon-sun-ray {
  width: 12px;
  height: 1px;
  border-radius: 8px;
  background: var(--scalar-color-1);
  position: absolute;
  transition: transform 0.3s ease-in-out;
}
.toggle-icon-sun-ray:nth-of-type(2) {
  transform: rotate(90deg);
}
.toggle-icon-sun-ray:nth-of-type(3) {
  transform: rotate(45deg);
}
.toggle-icon-sun-ray:nth-of-type(4) {
  transform: rotate(-45deg);
}
.toggle-icon-moon .toggle-icon-ellipse {
  width: 10px;
  height: 10px;
  mask-image: radial-gradient(
    circle at bottom left,
    pink 10px,
    transparent 12px
  );
}
.toggle-icon-moon .toggle-icon-sun-ray {
  transform: scale(0);
}
.toggle-icon-moon .toggle-icon-moon-mask {
  transform: translate3d(0, 0, 0);
}
</style>
