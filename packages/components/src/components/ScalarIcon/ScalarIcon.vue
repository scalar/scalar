<script setup lang="ts">
import { type VariantProps } from 'cva'
import { computed } from 'vue'

import { cva, cx } from '@/cva'

import SvgRenderer from './SvgRenderer'
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

const data = computed(() => getIcon(props.icon))
</script>

<template>
  <SvgRenderer
    v-if="data"
    :class="cx('scalar-icon', iconProps({ size }))"
    :raw="data" />
</template>
