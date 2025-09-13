<script lang="ts">
/**
 * Scalar Checkbox Group component
 *
 * A group of checkbox inputs allowing for multiple selections.
 */
export default {}
</script>
<script setup lang="ts">
import { useId } from 'vue'

import { ScalarFormInputGroup } from '../ScalarForm'
import ScalarCheckboxInput from './ScalarCheckboxInput.vue'
import type { ScalarCheckboxOption } from './types'

const { options = [] } = defineProps<{
  options?: ScalarCheckboxOption[]
}>()

const model = defineModel<ScalarCheckboxOption[]>({ default: [] })

const name = useId()
</script>
<template>
  <ScalarFormInputGroup>
    <ScalarCheckboxInput
      v-for="option in options"
      :value="option.value"
      :name
      :modelValue="model?.some(({ value }) => value === option.value)"
      @update:modelValue="
        (checked) =>
          (model = checked
            ? [...model, option]
            : model.filter(({ value }) => value !== option.value))
      "
      :key="option.value">
      {{ option.label }}
    </ScalarCheckboxInput>
  </ScalarFormInputGroup>
</template>
