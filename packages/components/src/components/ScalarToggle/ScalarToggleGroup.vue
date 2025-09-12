<script lang="ts">
/**
 * Scalar Toggle Group component
 *
 * A group of toggle inputs allowing for multiple selections.
 */
export default {}
</script>
<script setup lang="ts">
import type { ScalarCheckboxOption } from '../ScalarCheckboxInput'
import { ScalarFormInputGroup } from '../ScalarForm'
import ScalarToggleInput from './ScalarToggleInput.vue'

const { options = [] } = defineProps<{
  options?: ScalarCheckboxOption[]
}>()

const model = defineModel<ScalarCheckboxOption[]>({ default: [] })
</script>
<template>
  <ScalarFormInputGroup>
    <ScalarToggleInput
      v-for="option in options"
      :modelValue="model?.some(({ value }) => value === option.value)"
      @update:modelValue="
        (checked) =>
          (model = checked
            ? [...model, option]
            : model.filter(({ value }) => value !== option.value))
      "
      :key="option.value">
      {{ option.label }}
    </ScalarToggleInput>
  </ScalarFormInputGroup>
</template>
