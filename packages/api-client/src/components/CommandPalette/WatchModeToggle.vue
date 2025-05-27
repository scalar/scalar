<script setup lang="ts">
import { ScalarIcon, ScalarToggle } from '@scalar/components'
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
      <ScalarIcon
        icon="Watch"
        size="sm" />
      Watch Mode
    </span>
    <ScalarToggle
      id="watch-toggle"
      :disabled="Boolean(disabled)"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)" />
  </label>
</template>
