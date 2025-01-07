<script setup lang="ts">
import type { Component } from 'vue'

import { type Icon, ScalarIcon } from '../../'
import { cva } from '../../cva'
import { useBindCx } from '../../hooks/useBindCx'
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
    target="_blank"
    v-bind="cx(variants({ selected }))">
    <ScalarIcon
      :icon="icon"
      size="xs"
      thickness="2.5" />
    <span class="font-medium"><slot /></span>
  </ScalarMenuLink>
</template>
