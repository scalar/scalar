<script setup lang="ts">
import { ScalarIcon } from '@scalar/components/icon'
import { cva } from '@scalar/use-hooks/useBindCx'

import { useLocalization } from '@/v2/features/localization'

import DataTableCell from './DataTableCell.vue'

withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
    align?: 'left' | 'center'
    ariaLabel?: string
  }>(),
  {
    align: 'center',
  },
)

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const { translate } = useLocalization()

const variants = cva({
  base: 'w-8 h-8 flex items-center justify-center text-b-2 peer-checked:text-c-1 pointer-events-none absolute',
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
      :aria-label="ariaLabel ?? translate('apiClient.dataTableCheckbox.toggle')"
      :checked="modelValue"
      class="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-default"
      :disabled="Boolean(disabled)"
      type="checkbox"
      @change="(e: any) => $emit('update:modelValue', e.target.checked)" />
    <div :class="variants({ align })">
      <div
        class="absolute m-auto size-3/4 rounded border-[1px] opacity-0"
        :class="
          !disabled &&
          'group-has-[:focus-visible]/cell:border-c-accent group-hover:opacity-100 group-has-[:focus-visible]/cell:opacity-100'
        " />
      <ScalarIcon
        icon="Checkmark"
        size="xs"
        thickness="2.5" />
    </div>
  </DataTableCell>
</template>
