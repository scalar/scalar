<script setup lang="ts">
import type { VariantProps } from 'cva'

import { cva } from '@/cva'

import { type ButtonProps, ScalarButton } from '../ScalarButton'
import { type Icon, ScalarIcon } from '../ScalarIcon'

withDefaults(
  defineProps<{
    label: string
    icon: Icon
    size?: IconButtonVariants['size']
    variant?: ButtonProps['variant']
  }>(),
  {
    variant: 'ghost',
  },
)

const iconButton = cva('mt-d', {
  variants: {
    size: {
      xs: 'h-3.5 w-3.5',
      sm: 'h-5 w-5',
      md: 'h-10 w-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

type IconButtonVariants = VariantProps<typeof iconButton>
</script>

<template>
  <ScalarButton
    :class="size"
    :title="label"
    :variant="variant">
    <template #icon>
      <ScalarIcon :icon="icon" />
    </template>
  </ScalarButton>
</template>
