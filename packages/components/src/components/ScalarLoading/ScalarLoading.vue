<script lang="ts">
/**
 * Scalar Loading Component
 *
 * Displays a loading state for the application
 *
 * @example
 * import { ScalarLoading, useLoadingState } from '@scalar/components'
 *
 * const loader = useLoadingState()
 * loader.start()
 * ...
 * <ScalarLoading :loader="loader" />
 */
export default {}
</script>
<script setup lang="ts">
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'
import type { VariantProps } from 'cva'

import type { LoadingState } from './types'

type Variants = VariantProps<typeof variants>

defineProps<{
  loader?: LoadingState
  size?: Variants['size']
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const variants = cva({
  variants: {
    size: {
      'xs': 'size-3',
      'sm': 'size-3.5',
      'md': 'size-4',
      'lg': 'size-5',
      'xl': 'size-6',
      '2xl': 'size-8',
      '3xl': 'size-10',
      'full': 'size-full',
    },
  },
  defaultVariants: {
    size: 'full',
  },
})
</script>
<template>
  <div
    v-if="loader"
    v-bind="cx('loader-wrapper', variants({ size }))">
    <svg
      class="svg-loader"
      :class="{
        'icon-is-valid': loader.isValid,
        'icon-is-invalid': loader.isInvalid,
      }"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink">
      <path
        class="svg-path svg-check-mark"
        d="m 0 60 l 30 30 l 70 -80" />
      <path
        class="svg-path svg-x-mark"
        d="m 50 50 l 40 -40" />
      <path
        class="svg-path svg-x-mark"
        d="m 50 50 l 40 40" />
      <path
        class="svg-path svg-x-mark"
        d="m 50 50 l -40 -40" />
      <path
        class="svg-path svg-x-mark"
        d="m 50 50 l -40 40" />
      <g class="circular-loader">
        <circle
          class="loader-path"
          :class="{
            'loader-path-off': !loader.isLoading,
          }"
          cx="50"
          cy="50"
          fill="none"
          r="20"
          stroke-width="3" />
      </g>
    </svg>
  </div>
</template>
<style scoped>
.loader-wrapper {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  --loader-size: 50%;
}

/*SVG Positioning for Loader Objects*/
.svg-loader {
  width: var(--loader-size);
  height: var(--loader-size);
  top: 1rem;
  right: 0.9rem;
  overflow: visible;

  fill: none;
  background-color: transparent;
  stroke: currentColor;
}

.svg-path {
  stroke-width: 12;
  fill: none;
  transition: 0.3s;
}

.svg-x-mark {
  stroke-dasharray: 57;
  stroke-dashoffset: 57;
  transition-delay: 0s;
}

.svg-check-mark {
  stroke-dasharray: 149;
  stroke-dashoffset: 149;
  transition-delay: 0s;
}

.icon-is-invalid .svg-x-mark {
  stroke-dashoffset: 0;
  transition-delay: 0.3s;
}

.icon-is-valid .svg-check-mark {
  stroke-dashoffset: 0;
  transition-delay: 0.3s;
}

.circular-loader {
  animation:
    rotate 0.7s linear infinite,
    fade-in 0.4s;

  transform-origin: center center;
  transform: scale(3.5);

  background: transparent;
}

.loader-path {
  stroke-dasharray: 50, 200;
  stroke-dashoffset: -100;
  stroke-linecap: round;
}

.loader-path-off {
  stroke-dasharray: 50, 200;
  stroke-dashoffset: -100;
  transition: opacity 0.3s;
  opacity: 0;
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  70% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes rotate {
  from {
    transform: scale(3.5) rotate(0deg);
  }
  to {
    transform: scale(3.5) rotate(360deg);
  }
}
</style>
