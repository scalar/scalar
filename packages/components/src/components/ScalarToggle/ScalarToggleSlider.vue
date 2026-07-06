<script setup lang="ts">
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'

const {
  thumb = 'start',
  disabled,
  label,
} = defineProps<{
  /** Resting position of the thumb within the track */
  thumb?: 'start' | 'center' | 'end'
  /** Visually dims the control and applies a not-allowed cursor */
  disabled?: boolean
  /** Accessible label announced to assistive technology */
  label?: string
}>()

const variants = cva({
  base: 'relative h-3.5 min-w-6 w-6 cursor-pointer rounded-full bg-b-3 transition-colors duration-300',
  variants: {
    disabled: { true: 'cursor-not-allowed opacity-40' },
  },
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <button
    :aria-disabled="disabled"
    type="button"
    v-bind="cx(variants({ disabled }))">
    <div
      class="absolute left-px top-px flex h-3 w-3 items-center justify-center rounded-full bg-b-1 transition-transform duration-300"
      :class="{
        'translate-x-1.25': thumb === 'center',
        'translate-x-2.5': thumb === 'end',
      }" />
    <span
      v-if="label"
      class="sr-only">
      {{ label }}
    </span>
  </button>
</template>
