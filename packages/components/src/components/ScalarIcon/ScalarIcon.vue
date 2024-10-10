<script setup lang="ts">
import type { VariantProps } from 'cva'
import { computed } from 'vue'

import { cva, cx } from '../../cva'
import { type Icon, getIcon } from './icons/'

type IconVariants = VariantProps<typeof iconProps>

/**
 * Icon wrapper for all scalar icons
 */
const props = defineProps<{
  icon: Icon
  size?: IconVariants['size']
  thickness?: string
  label?: string
}>()

const iconProps = cva({
  variants: {
    size: {
      'xs': 'size-3',
      'sm': 'size-3.5',
      'md': 'size-4',
      'lg': 'size-5',
      'xl': 'size-6',
      '2xl': 'size-8',
      '3xl': 'size-10',
      'full': 'size-full',
    },
  },
  defaultVariants: {
    size: 'full',
  },
})

const stroke = computed(() => props.thickness ?? '2')

const accessibilityAttrs = computed(() =>
  props.label
    ? { ariaLabel: props.label }
    : {
        ariaHidden: true,
        role: 'presentation',
      },
)
</script>
<template>
  <component
    :is="getIcon(icon)"
    :class="cx('scalar-icon', iconProps({ size }))"
    v-bind="accessibilityAttrs" />
</template>
<style scoped>
.scalar-icon,
.scalar-icon * {
  stroke-width: v-bind(stroke);
}
</style>
