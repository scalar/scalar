<script setup lang="ts">
import { cva, cx } from '@scalar/components'

const { modelValue } = defineProps<{
  modelValue: string
}>()

defineEmits<(e: 'update:modelValue', value: string) => void>()

const buttonVariants = cva({
  base: 'border py-1 text-c-2 rounded-md',
  variants: {
    active: {
      true: 'bg-b-2 bordber-c-2 text-c-1',
      false: 'border-transparent hover:bg-b-2 hover:text-c-1',
    },
  },
})
</script>

<template>
  <button
    class="px-3"
    :class="
      cx(
        buttonVariants({
          active: modelValue === 'preview',
        }),
      )
    "
    type="button"
    @click="$emit('update:modelValue', 'preview')">
    Preview
  </button>
  <button
    :class="cx(buttonVariants({ active: modelValue === 'edit' }))"
    type="button"
    @click="$emit('update:modelValue', 'edit')">
    Edit
  </button>
</template>
