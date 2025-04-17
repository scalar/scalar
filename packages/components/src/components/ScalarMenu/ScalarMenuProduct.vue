<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { cva } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

import type { Icon } from '../../'
import { ScalarMenuLink } from './'

const { is = 'a' } = defineProps<{
  is?: string | Component
  selected?: boolean
  icon: Icon
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const variants = cva({
  base: 'gap-1.5',
  variants: {
    selected: {
      true: 'pointer-events-none bg-b-2 dark:bg-b-3',
      false: 'cursor-pointer hover:bg-b-2 dark:hover:bg-b-3',
    },
  },
})
</script>
<template>
  <ScalarMenuLink
    :is="is"
    :icon="icon"
    strong
    target="_blank"
    v-bind="cx(variants({ selected }))">
    <slot />
  </ScalarMenuLink>
</template>
