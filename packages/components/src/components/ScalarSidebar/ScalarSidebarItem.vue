<script setup lang="ts">
import { cva } from '@/cva'
import type { Component } from 'vue'

import { useBindCx } from '../../hooks/useBindCx'

const {
  is = 'a',
  selected,
  disabled,
} = defineProps<{
  is?: Component | string
  selected?: boolean
  disabled?: boolean
}>()

const variants = cva({
  base: 'rounded p-1.5 font-medium text-c-2',
  variants: {
    selected: {
      true: 'cursor-auto bg-b-2 text-c-1',
    },
    disabled: {
      true: 'cursor-auto',
    },
  },
  compoundVariants: [
    {
      selected: false,
      disabled: false,
      class: 'hover:bg-b-2',
    },
  ],
  defaultVariants: {
    selected: false,
    disabled: false,
  },
})
defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="cx(variants({ selected, disabled }))">
    <div class="flex items-center gap-1 flex-1">
      <div class="size-4">
        <slot name="icon" />
      </div>
      <slot />
    </div>
    <div v-if="$slots.aside">
      <slot name="aside" />
    </div>
  </component>
</template>
