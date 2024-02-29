<script setup lang="ts">
import type { VariantProps } from 'cva'

import { cva, cx } from '../../cva'
import { styles } from '../ScalarButton'
import { type Icon, ScalarIcon } from '../ScalarIcon'

type Variants = VariantProps<typeof variants>

withDefaults(
  defineProps<{
    label: string
    icon: Icon
    disabled?: boolean
    variant?: Variants['variant']
    size?: Variants['size']
  }>(),
  {
    variant: 'ghost',
    size: 'md',
  },
)

const variants = cva({
  base: 'scalar-icon-button grid aspect-square cursor-pointer rounded',
  variants: {
    size: {
      xs: 'h-3.5 w-3.5 p-0.5',
      sm: 'h-5 w-5 p-1',
      md: 'h-10 w-10 p-3',
      full: 'h-full w-full',
    },
    disabled: {
      true: 'cursor-not-allowed shadow-none',
    },
    variant: styles,
  },
})
</script>
<template>
  <button
    :ariaDisabled="disabled || undefined"
    :class="cx(variants({ size, variant, disabled }))"
    type="button">
    <ScalarIcon :icon="icon" />
    <span class="sr-only">{{ label }}</span>
  </button>
</template>
