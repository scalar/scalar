<script setup lang="ts">
import { ScalarIconWarning, ScalarIconWarningCircle } from '@scalar/icons'
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'
import { type Component, computed } from 'vue'

const { variant = 'error', icon } = defineProps<{
  /** The variant of the error */
  variant?: 'error' | 'warning'
  /** Whether to show the icon */
  icon?: Component | undefined
}>()

const iconIs = computed(() => {
  if (icon) {
    return icon
  }
  return variant === 'error' ? ScalarIconWarningCircle : ScalarIconWarning
})

const variants = cva({
  base: 'flex items-baseline gap-1.5 rounded border p-2',
  variants: {
    variant: {
      error: 'border-c-danger bg-b-danger text-c-danger',
      warning: 'border-c-alert bg-b-alert text-c-alert',
    },
  },
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    role="alert"
    v-bind="cx(variants({ variant }))">
    <component
      :is="iconIs"
      class="relative top-0.5 shrink-0"
      weight="bold" />
    <slot />
  </div>
</template>
