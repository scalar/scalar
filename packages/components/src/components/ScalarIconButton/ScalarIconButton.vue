<script setup lang="ts">
import type { VariantProps } from 'cva'
import { computed, useAttrs } from 'vue'

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
      xs: 'size-3.5 p-0.5',
      sm: 'size-6 p-1',
      md: 'size-10 p-3',
      full: 'h-full w-full',
    },
    disabled: {
      true: 'cursor-not-allowed shadow-none',
    },
    variant: styles,
  },
})

/* Extract the classes so they can be merged by `cx` */
const attrs = computed(() => {
  const { class: className, ...rest } = useAttrs()
  return { class: className || '', rest }
})
</script>
<template>
  <button
    v-bind="attrs.rest"
    :ariaDisabled="disabled || undefined"
    :class="cx(variants({ size, variant, disabled }), attrs.class)"
    type="button">
    <ScalarIcon :icon="icon" />
    <span class="sr-only">{{ label }}</span>
  </button>
</template>
