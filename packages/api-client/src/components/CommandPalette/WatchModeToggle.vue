<script setup lang="ts">
import { ScalarToggle } from '@scalar/components'
import { ScalarIconEye } from '@scalar/icons'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <label
    class="text-c-2 flex items-center gap-2 rounded p-3 py-1.5 text-sm select-none"
    :class="disabled ? 'cursor-default' : 'cursor-pointer'"
    for="watch-toggle">
    <span
      class="text-c-1 flex items-center gap-1 text-xs font-medium"
      :class="{ 'text-c-3': !modelValue }">
      <ScalarIconEye class="size-3.5" />
      Watch Mode
    </span>
    <ScalarToggle
      id="watch-toggle"
      :disabled="Boolean(disabled)"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)" />
  </label>
</template>
