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
    <ScalarIcon
      class="centered text-border peer-checked:text-c-2 group-hover/cell:text-c-1 pointer-events-none absolute stroke-[1.2]"
      icon="Checkmark"
      size="xs" />
  </DataTableCell>
</template>
