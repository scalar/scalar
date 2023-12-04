<script setup lang="ts">
import type { VariantProps } from 'cva'

import { cva } from '@/cva'

import { type ButtonProps, ScalarButton } from '../ScalarButton'
import { type Icon, ScalarIcon } from '../ScalarIcon'

type IconButtonVariants = VariantProps<typeof iconButton>

withDefaults(
  defineProps<{
    label: string
    icon: Icon
    variant?: ButtonProps['variant']
    size?: IconButtonVariants['size']
  }>(),
  {
    variant: 'ghost',
  },
)

const iconButton = cva({
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
