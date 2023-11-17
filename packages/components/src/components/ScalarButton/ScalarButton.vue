<script lang="ts">
const button = cva({
  base: 'scalar-button row items-center justify-center rounded font-medium',
  variants: {
    isDisabled: { true: 'bg-background-2 text-color-3 shadow-none' },
    isFullWidth: { true: 'w-full' },
    isIconOnly: { true: 'scalar-button-icon' },
    size: { md: 'h-10 px-6 text-sm' },
    variant: {
      solid: [
        'scalar-button-solid',
        'hocus:bg-hover-btn-1 bg-back-btn-1 text-fore-btn-1 shadow-sm active:bg-back-btn-1 active:shadow-none',
      ].join(' '),
      outlined: [
        'scalar-button-outlined',
        'active:bg-btn-1 hocus:bg-back-2 border border-border bg-transparent text-fore-1',
      ].join(' '),
      ghost: [
        'scalar-button-ghost',
        'hocus:text-fore-2 bg-transparent text-fore-3 active:text-fore-2',
      ].join(' '),
      danger: [
        'scalar-button-danger',
        'hocus:brightness-90 bg-error text-white active:brightness-90',
      ].join(' '),
    },
  },
  compoundVariants: [
    {
      isDisabled: true,
      variant: 'ghost',
      class: 'bg-transparent text-ghost',
    },
    {
      isIconOnly: true,
      size: 'md',
      class: 'h-10 w-10 p-2',
    },
  ],
})

type ButtonVariants = VariantProps<typeof button>

export type ButtonProps = {
  isDisabled?: boolean
  isFullWidth?: boolean
  loadingState?: LoadingState
  size?: ButtonVariants['size']
  variant?: ButtonVariants['variant']
  title?: string
}
</script>

<script setup lang="ts">
import { type VariantProps } from 'cva'
import { cx, cva } from '@/cva'

import { useSlots, computed } from 'vue'
import { ScalarLoading, type LoadingState } from '../ScalarLoading'

/**
 * Scalar Button
 *
 * - Default slot must be text only as it becomes the [aria]-label
 * - If you pass an icon slot with no default slot it becomes an icon button
 * - You should also pass a title if you do this which gets added as the aria label
 */
withDefaults(defineProps<ButtonProps>(), {
  isDisabled: false,
  isFullWidth: false,
  size: 'md',
  variant: 'solid',
})

const slots = useSlots()
const label = computed(() =>
  (slots.default?.()?.[0]?.children as string)?.trim(),
)
const isIconOnly = computed(() => Boolean(slots.icon && !slots.default))
</script>

<template>
  <button
    :aria-disabled="isDisabled"
    :aria-label="label || title"
    :class="
      cx(
        button({
          isFullWidth,
          isIconOnly,
          isDisabled,
          size,
          variant,
        }),
        { 'pl-9 pr-3': loadingState },
      )
    "
    :title="title || label"
    type="button">
    <div
      v-if="$slots.icon"
      :class="cx({ 'mr-2': !isIconOnly }, 'h-4 w-4')">
      <slot name="icon" />
    </div>
    <slot />
    <div
      v-if="loadingState"
      class="ml-2">
      <ScalarLoading
        :loadingState="loadingState"
        size="20px" />
    </div>
  </button>
</template>
