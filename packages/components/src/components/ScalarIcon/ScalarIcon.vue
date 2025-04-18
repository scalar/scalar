<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { cva } from '@scalar/use-hooks/useBindCx'
import type { VariantProps } from 'cva'
import { computed } from 'vue'

import { type Icon, type Logo, getIcon, getLogo } from './utils'

/**
 * Icon wrapper for all icons and logos
 */

type IconVariants = VariantProps<typeof iconProps>

const props = defineProps<{
  icon?: Icon
  logo?: Logo
  size?: IconVariants['size']
  thickness?: string
  label?: string
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

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

const svg = computed(() => {
  if (props.icon) {
    return getIcon(props.icon)
  }
  if (props.logo) {
    return getLogo(props.logo)
  }

  return undefined
})
</script>
<template>
  <component
    :is="svg"
    v-bind="{
      ...cx('scalar-icon', iconProps({ size })),
      ...accessibilityAttrs,
    }" />
</template>
<style scoped>
.scalar-icon,
.scalar-icon * {
  stroke-width: v-bind(stroke);
}
</style>
