<script setup lang="ts">
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'

import type { ScalarToggleSize } from './types'

const {
  thumb = 'start',
  size = 'sm',
  disabled,
  label,
} = defineProps<{
  /** Resting position of the thumb within the track */
  thumb?: 'start' | 'center' | 'end'
  /** Size of the track and thumb */
  size?: ScalarToggleSize
  /** Visually dims the control and applies a not-allowed cursor */
  disabled?: boolean
  /** Accessible label announced to assistive technology */
  label?: string
}>()

const variants = cva({
  base: 'relative cursor-pointer rounded-full bg-b-3 transition-colors duration-300',
  variants: {
    size: {
      sm: 'h-3.5 min-w-6 w-6',
      md: 'h-5 min-w-8 w-8',
    },
    disabled: { true: 'cursor-not-allowed opacity-40' },
  },
})

/**
 * The thumb travels the width of the track minus its own width and the inset
 * on both sides, so each size needs its own offsets for the center and end.
 */
const thumbVariants = cva({
  base: 'bg-b-1 absolute flex items-center justify-center rounded-full transition-transform duration-300',
  variants: {
    size: {
      sm: 'top-px left-px size-3',
      md: 'top-0.5 left-0.5 size-4',
    },
    thumb: { start: '', center: '', end: '' },
  },
  compoundVariants: [
    { size: 'sm', thumb: 'center', class: 'translate-x-1.25' },
    { size: 'sm', thumb: 'end', class: 'translate-x-2.5' },
    { size: 'md', thumb: 'center', class: 'translate-x-1.5' },
    { size: 'md', thumb: 'end', class: 'translate-x-3' },
  ],
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <button
    :aria-disabled="disabled"
    type="button"
    v-bind="cx(variants({ size, disabled }))">
    <div :class="thumbVariants({ size, thumb })" />
    <span
      v-if="label"
      class="sr-only">
      {{ label }}
    </span>
  </button>
</template>
