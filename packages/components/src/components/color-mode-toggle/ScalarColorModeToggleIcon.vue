<script lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { type Component, computed } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type ScalarColorModeToggle from './ScalarColorModeToggle.vue'

/**
 * Scalar Color Mode Toggle Icon component
 *
 * An icon that toggles between a sun and moon.
 *
 * If you need a toggle that is aware of and sets color mode,
 * you want {@link ScalarColorModeToggle} instead.
 *
 * @example
 *   <ScalarColorModeToggleIcon v-model="isDarkMode" />
 */
export default {}
</script>
<script lang="ts" setup>
const { is = 'button', mode = 'light' } = defineProps<{
  /** The element or component this component should render as. */
  is?: string | Component
  /** Whether the toggle is a sun or moon icon */
  mode?: 'light' | 'dark'
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const ariaLabel = computed<string>(() =>
  mode === 'dark' ? 'Set light mode' : 'Set dark mode',
)
</script>
<template>
  <!-- Icon -->
  <component
    :is="is"
    :aria-label="ariaLabel"
    :class="`toggle-icon-${mode}`"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="cx('size-3 flex items-center justify-center text-c-1')">
    <span class="toggle-icon-sun-ray" />
    <span class="toggle-icon-sun-ray" />
    <span class="toggle-icon-sun-ray" />
    <span class="toggle-icon-sun-ray" />
    <span class="toggle-icon-ellipse">
      <span class="toggle-icon-moon-mask" />
    </span>
  </component>
</template>
<style scoped>
.toggle-icon-ellipse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px currentColor;
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
  border: 1px solid currentColor;
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
  background: currentColor;
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
.toggle-icon-dark .toggle-icon-ellipse {
  width: 10px;
  height: 10px;
  mask-image: radial-gradient(
    circle at bottom left,
    pink 10px,
    transparent 12px
  );
}
.toggle-icon-dark .toggle-icon-sun-ray {
  transform: scale(0);
}
.toggle-icon-dark .toggle-icon-moon-mask {
  transform: translate3d(0, 0, 0);
}
</style>
