<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { cva } from 'cva'

import DataTableCell from './DataTableCell.vue'

withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
    align?: 'left' | 'center'
  }>(),
  {
    align: 'center',
  },
)

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const variants = cva({
  base: 'w-8 h-8 flex items-center justify-center text-border peer-checked:text-c-2 pointer-events-none absolute before:absolute before:opacity-0 group-hover/cell:before:opacity-100 before:border before:rounded before:w-9/12 before:aspect-square before:top-1/2 before:left-1/2 before:transform before:-translate-x-1/2 before:-translate-y-1/2 before:border-[1px]',
  variants: {
    align: {
      left: 'left-0',
      center: 'centered',
    },
  },
})
</script>
<template>
  <DataTableCell class="group/cell relative flex min-w-8">
    <input
      :checked="modelValue"
      class="peer absolute inset-0 opacity-0 cursor-pointer"
      :disabled="disabled"
      tabindex="-1"
      type="checkbox"
      @change="(e: any) => $emit('update:modelValue', e.target.checked)" />
    <div :class="variants({ align })">
      <ScalarIcon
        icon="Checkmark"
        size="xs"
        thickness="2.5" />
    </div>
  </DataTableCell>
</template>
