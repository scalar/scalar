<script setup lang="ts">
import { type Icon, ScalarIcon } from '../../'
import { cva } from '../../cva'
import { useBindCx } from '../../hooks/useBindCx'

defineProps<{
  selected?: boolean
  icon: Icon
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const variants = cva({
  base: 'relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded px-2 py-1.5 leading no-underline flex-row',
  variants: {
    selected: {
      true: 'pointer-events-none bg-b-2',
      false: 'cursor-pointer bg-b-1 hover:bg-b-2',
    },
  },
})
</script>
<template>
  <a
    target="_blank"
    v-bind="cx(variants({ selected }))">
    <ScalarIcon
      :icon="icon"
      size="xs"
      thickness="2.5" />
    <span class="font-medium"><slot /></span>
  </a>
</template>
