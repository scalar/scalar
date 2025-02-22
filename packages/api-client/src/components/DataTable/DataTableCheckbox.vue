<script setup lang="ts">
import { cva, ScalarIcon } from '@scalar/components'

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
  base: 'w-8 h-8 flex items-center justify-center text-border peer-checked:text-c-1 pointer-events-none absolute',
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
      class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default"
      :disabled="Boolean(disabled)"
      type="checkbox"
      @change="(e: any) => $emit('update:modelValue', e.target.checked)" />
    <div :class="variants({ align })">
      <div
        class="absolute m-auto size-3/4 rounded border-[1px] opacity-0"
        :class="
          !disabled &&
          'group-has-[:focus-visible]/cell:border-c-accent group-hover/cell:opacity-100 group-has-[:focus-visible]/cell:opacity-100'
        " />
      <ScalarIcon
        icon="Checkmark"
        size="xs"
        thickness="2.5" />
    </div>
  </DataTableCell>
</template>
