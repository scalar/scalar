<script setup lang="ts">
import type { SpecConfiguration } from '@scalar/types'
import { computed } from 'vue'

const { options } = defineProps<{
  options?: SpecConfiguration[]
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// Show the selector if there are multiple options
const showSelector = computed(() => options && options?.length > 1)

// Emit the selected option
const handleChange = (event: Event) => {
  emit(
    'update:modelValue',
    Number.parseInt((event.target as HTMLSelectElement).value, 10),
  )
}
</script>

<template>
  <template v-if="showSelector">
    <select
      class="api-definition-selector w-full"
      :value="modelValue"
      @change="handleChange">
      <option
        v-for="(option, index) in options"
        :key="index"
        :value="index">
        <template v-if="option.name">
          {{ option.name }}
        </template>
        <template v-else> #{{ index }} </template>
      </option>
    </select>
  </template>
</template>
