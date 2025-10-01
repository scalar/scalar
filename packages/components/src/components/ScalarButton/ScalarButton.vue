<script lang="ts">
/**
 * Scalar Button Component
 *
 * Provides a styled button, if you are looking for
 * an icon only button, use ScalarIconButton instead,
 * it's a helpful wrapper around this component
 *
 * @example
 *   <ScalarButton>
 *     <!-- Button label -->
 *   </ScalarButton>
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
  size = 'md',
  variant = 'solid',
  type = 'button',
} = defineProps<ScalarButtonProps>()

const variants = cva({
  base: 'scalar-button flex cursor-pointer items-center justify-center rounded font-medium -outline-offset-1',
  variants: {
    disabled: { true: 'bg-b-2 text-color-3 shadow-none' },
    fullWidth: { true: 'w-full' },
    size: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-5 py-3 text-sm leading-5',
    } satisfies Record<ButtonSize, ClassList>,
    variant: BUTTON_VARIANT_STYLES,
  },
  compoundVariants: [
    {
      disabled: true,
      variant: ['solid', 'outlined', 'ghost', 'danger'],
      class:
        'bg-b-2 text-c-3 shadow-none hover:bg-b-[_] cursor-not-allowed active:bg-b-[_] hover:text-c-[_] active:text-c-[_]',
    },
  ],
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <button
    :aria-disabled="disabled || undefined"
    :type="type"
    v-bind="
      cx(variants({ fullWidth, disabled, size, variant }), {
        relative: loading?.isLoading,
      })
    ">
    <div
      v-if="$slots.icon || icon"
      class="-ml-0.5 mr-1.5 size-3.5 shrink-0"
      :class="{ invisible: loading?.isLoading }">
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
        :loadingState="loading"
        size="xl" />
    </div>
  </button>
</template>
