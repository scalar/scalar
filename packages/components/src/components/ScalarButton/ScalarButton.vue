<script lang="ts">
/**
 * Scalar Button Component
 *
 * Provides a styled button, if you are looking for
 * an icon only button, use ScalarIconButton instead,
 * it's a helpful wrapper around this component
 *
 * @example
 * <ScalarButton>
 *   <!-- Button label -->
 * </ScalarButton>
 */
export default {}
</script>
<script setup lang="ts">
import type {
  ButtonSize,
  ClassList,
  ScalarButtonProps,
} from '@/components/ScalarButton/types'
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarLoading } from '../ScalarLoading'
import { BUTTON_VARIANT_STYLES } from './constants'

const {
  is = 'button',
  size = 'md',
  variant = 'solid',
} = defineProps<ScalarButtonProps>()

/** Variant styles for the button (wrapper) */
const buttonVariants = cva({
  base: 'scalar-button flex cursor-pointer items-center justify-center rounded font-medium -outline-offset-1',
  variants: {
    disabled: { true: 'bg-b-2 text-color-3 shadow-none' },
    size: {
      xs: 'px-2 py-1 text-xs leading-5',
      sm: 'px-3.5 py-2 text-sm leading-5',
      md: 'px-5 py-3 text-sm leading-5',
    } satisfies Record<ButtonSize, ClassList>,
    variant: BUTTON_VARIANT_STYLES,
  },
  compoundVariants: [
    {
      disabled: true,
      variant: ['solid', 'outlined', 'ghost', 'gradient', 'danger'],
      class:
        'bg-b-2 text-c-3 shadow-none hover:bg-b-[_] cursor-not-allowed active:bg-b-[_] hover:text-c-[_] active:text-c-[_]',
    },
    {
      disabled: true,
      variant: ['gradient'],
      class:
        'to-b-1.5 bg-linear-to-b hover:bg-linear-to-b dark:hover:bg-linear-to-t',
    },
  ],
})

/** Variant styles for the button icon */
const iconVariants = cva({
  base: 'shrink-0',
  variants: {
    size: {
      xs: 'size-2.75 -ml-0.25 mr-1',
      sm: 'size-3.25 -ml-0.5 mr-1.5',
      md: 'size-3.5 -ml-0.5 mr-1.5',
    } satisfies Record<ButtonSize, ClassList>,
  },
})

/** Variant styles for the loading icon */
const loadingVariants = cva({
  variants: {
    size: {
      xs: 'size-4',
      sm: 'size-5',
      md: 'size-6',
    } satisfies Record<ButtonSize, ClassList>,
  },
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    :aria-disabled="disabled || undefined"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="
      cx(buttonVariants({ disabled, size, variant }), {
        relative: loading?.isLoading,
      })
    ">
    <div
      v-if="$slots.icon || icon"
      :class="[iconVariants({ size }), { invisible: loading?.isLoading }]">
      <slot name="icon">
        <component
          :is="icon"
          class="size-full" />
      </slot>
    </div>
    <span
      v-if="loading"
      :class="{ invisible: loading?.isLoading }">
      <slot />
    </span>
    <slot v-else />
    <div
      v-if="loading?.isLoading"
      class="centered">
      <ScalarLoading
        :class="loadingVariants({ size })"
        :loadingState="loading" />
    </div>
  </component>
</template>
