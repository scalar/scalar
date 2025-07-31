<script setup lang="ts">
import { EXAMPLE_SCRIPTS } from '@/consts/example-scripts'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const addExample = (example: string) => {
  let addition = example
  // Look at current value. If it's not empty, add a new line.
  if (props.modelValue.trim() !== '') {
    addition = `\n\n${addition}`
  }

  emit('update:modelValue', props.modelValue.trim() + addition)
}
</script>

<template>
  <ul class="flex flex-wrap gap-1">
    <li
      v-for="example in EXAMPLE_SCRIPTS"
      :key="example.title"
      class="bg-b-2 text-c-2 hover:bg-b-3 inline-flex flex-col rounded-full px-3 py-1 text-xs font-medium">
      <button
        type="button"
        class="w-full"
        @click="addExample(example.script)">
        {{ example.title }}
      </button>
    </li>
  </ul>
</template>
