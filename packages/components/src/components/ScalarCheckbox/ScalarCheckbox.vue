<script setup lang="ts">
import { cva } from '../../cva'
import { ScalarIcon } from '../ScalarIcon'

withDefaults(
  defineProps<{
    modelValue?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'sm',
  },
)

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const sizeClass = cva({
  base: '',
  variants: {
    size: {
      sm: 'h-5 min-h-5 w-5 min-w-5',
      md: 'h-6 min-h-6 w-6 min-w-6',
      lg: 'h-8 min-h-8 w-8 min-w-8',
    },
  },
})
</script>
<template>
  <div
    class="relative flex items-center justify-center rounded border-[1px]"
    :class="sizeClass({ size })">
    <input
      :checked="modelValue"
      class="peer absolute inset-0 cursor-pointer opacity-0"
      type="checkbox"
      @change="
        $emit(
          'update:modelValue',
          !!($event.target as HTMLInputElement)?.checked,
        )
      " />

    <ScalarIcon
      class="pointer-events-none opacity-0 peer-checked:text-c-2 peer-checked:opacity-100"
      icon="Checkmark"
      size="xs"
      thickness="2.5" />
  </div>
</template>
