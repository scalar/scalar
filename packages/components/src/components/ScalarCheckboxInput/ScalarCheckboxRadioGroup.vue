<script lang="ts">
/**
 * Scalar Checkbox Radio Group component
 *
 * A group of radio inputs allowing for single selection.
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

const model = defineModel<ScalarCheckboxOption>()

const name = useId()
</script>
<template>
  <ScalarFormInputGroup>
    <ScalarCheckboxInput
      v-for="option in options"
      :key="option.value"
      :modelValue="model?.value === option.value"
      :name
      type="radio"
      :value="option.value"
      @update:modelValue="(checked) => (model = checked ? option : undefined)">
      {{ option.label }}
    </ScalarCheckboxInput>
  </ScalarFormInputGroup>
</template>
