<script setup lang="ts">
import type { VariantProps } from 'cva'

import { cva, cx } from '../../cva'
import { type Icon, getIcon } from './icons/'

type IconVariants = VariantProps<typeof iconProps>

/**
 * Icon wrapper for all scalar icons
 */
const props = defineProps<{
  icon: Icon
  size?: IconVariants['size']
}>()

const iconProps = cva({
  variants: {
    size: {
      'xs': 'size-3 stroke-[1.4]',
      'sm': 'size-3.5 stroke-[1.2]',
      'md': 'size-4 stroke-[1.1]',
      'lg': 'size-5',
      'xl': 'size-6 stroke-[0.96]',
      '2xl': 'size-8 stroke-[0.92]',
      '3xl': 'size-10 stroke-[0.9]',
      'full': 'size-full',
    },
  },
  defaultVariants: {
    size: 'full',
  },
})

const iconComp = getIcon(props.icon)
</script>

<template>
  <component
    :is="getIcon(icon)"
    v-if="iconComp"
    :class="cx('scalar-icon', iconProps({ size }))" />
  <!-- Temp fallback to match with other component but we should remove this -->
  <img
    v-else
    :src="icon" />
</template>
