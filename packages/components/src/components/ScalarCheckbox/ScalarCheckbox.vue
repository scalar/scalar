<script setup lang="ts">
import { cva } from '@scalar/use-hooks/useBindCx'
import { nanoid } from 'nanoid'

import { ScalarIcon } from '../ScalarIcon'

withDefaults(
  defineProps<{
    modelValue?: boolean
    size?: 'sm' | 'md' | 'lg'
    id?: string
    label?: string
  }>(),
  {
    size: 'sm',
    id: nanoid(),
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
  <div class="scalar-checkbox flex items-center gap-2">
    <div
      class="relative flex items-center justify-center rounded border-[1px]"
      :class="sizeClass({ size })">
      <input
        :id="id"
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
    <label
      v-if="label"
      class="label"
      :for="id">
      <slot>{{ label }}</slot>
    </label>
  </div>
</template>
<style scoped>
.scalar-checkbox {
  font-size: var(--scalar-font-size-3);
}
</style>
