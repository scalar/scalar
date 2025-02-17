<script setup lang="ts">
import { cva, cx, ScalarButton } from '@scalar/components'

const { modelValue } = defineProps<{
  modelValue: string
}>()

defineEmits<(e: 'update:modelValue', value: string) => void>()

const buttonVariants = cva({
  base: 'border h-fit py-1 text-c-2 rounded-md',
  variants: {
    active: {
      true: 'bg-b-2 bordber-c-2 text-c-1',
      false: 'border-transparent hover:bg-b-2 hover:text-c-1',
    },
  },
})
</script>

<template>
  <ScalarButton
    class="px-3"
    :class="
      cx(
        buttonVariants({
          active: modelValue === 'preview',
        }),
      )
    "
    type="button"
    variant="ghost"
    @mousedown.prevent
    @click="$emit('update:modelValue', 'preview')">
    Preview
  </ScalarButton>
  <ScalarButton
    :class="cx(buttonVariants({ active: modelValue === 'edit' }))"
    type="button"
    variant="ghost"
    @mousedown.prevent
    @click="$emit('update:modelValue', 'edit')">
    Edit
  </ScalarButton>
</template>
