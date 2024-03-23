<script setup lang="ts">
import { type VariantProps } from 'cva'

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
      xs: 'h-3 w-3',
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
      full: 'h-full w-full',
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
