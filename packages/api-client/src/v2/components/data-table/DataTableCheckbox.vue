<script setup lang="ts">
import { ScalarIcon } from '@scalar/components/icon'
import { cva } from '@scalar/use-hooks/useBindCx'
import { nextTick, ref } from 'vue'

import DataTableCell from './DataTableCell.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
    align?: 'left' | 'center'
  }>(),
  {
    align: 'center',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const input = ref<HTMLInputElement | null>(null)

/**
 * Clicking a native checkbox flips its `checked` state immediately, before the parent has a
 * chance to accept (or reject) the change. When the parent leaves `modelValue` unchanged the
 * `:checked` binding has nothing to patch, so the box would stay visually out of sync with the
 * value it represents. Re-asserting `modelValue` after the update keeps the rendered state and
 * the source of truth aligned in both the accepted and rejected cases.
 */
const onChange = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
  nextTick(() => {
    if (input.value) {
      input.value.checked = props.modelValue
    }
  })
}

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
      ref="input"
      :checked="modelValue"
      class="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-default"
      :disabled="Boolean(disabled)"
      type="checkbox"
      @change="onChange" />
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
