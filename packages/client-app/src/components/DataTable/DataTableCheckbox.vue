<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

import DataTableCell from './DataTableCell.vue'

defineProps<{
  modelValue: boolean
  disabled?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()
</script>
<template>
  <DataTableCell class="group/cell relative flex min-w-8 cursor-pointer">
    <input
      :checked="modelValue"
      class="peer absolute inset-0 opacity-0"
      :disabled="disabled"
      tabindex="-1"
      type="checkbox"
      @change="(e: any) => $emit('update:modelValue', e.target.checked)" />
    <div
      class="w-full h-full flex items-center justify-center centered text-border peer-checked:text-c-2 pointer-events-none absolute stroke-[1.2] before:absolute before:opacity-0 group-hover/cell:before:opacity-100 before:border before:rounded before:w-9/12 before:aspect-square before:top-1/2 before:left-1/2 before:transform before:-translate-x-1/2 before:-translate-y-1/2 before:border-[1px]">
      <ScalarIcon
        icon="Checkmark"
        size="xs" />
    </div>
  </DataTableCell>
</template>
