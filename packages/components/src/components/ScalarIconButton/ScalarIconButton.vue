<script setup lang="ts">
import type { ScalarIconWeight } from '@scalar/icons/types'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { cva } from '@scalar/use-hooks/useBindCx'
import type { VariantProps } from 'cva'
import type { Component } from 'vue'

import { styles } from '../ScalarButton'
import { type Icon, ScalarIconLegacyAdapter } from '../ScalarIcon'

type Variants = VariantProps<typeof variants>

withDefaults(
  defineProps<{
    label: string
    icon: Icon | Component
    disabled?: boolean
    variant?: Variants['variant']
    size?: Variants['size']
    thickness?: string
    weight?: ScalarIconWeight
  }>(),
  {
    variant: 'ghost',
    size: 'md',
  },
)

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const variants = cva({
  base: 'scalar-icon-button grid aspect-square cursor-pointer rounded',
  variants: {
    size: {
      xxs: 'size-3.5 p-0.5',
      xs: 'size-5 p-1',
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
</script>
<template>
  <button
    :ariaDisabled="disabled || undefined"
    type="button"
    v-bind="cx(variants({ size, variant, disabled }))">
    <ScalarIconLegacyAdapter
      :icon="icon"
      :thickness="thickness"
      :weight="weight" />
    <span class="sr-only">{{ label }}</span>
  </button>
</template>
