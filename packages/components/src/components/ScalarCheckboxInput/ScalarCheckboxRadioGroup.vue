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
      type="radio"
      :value="option.value"
      :name
      :modelValue="model?.value === option.value"
      @update:modelValue="(checked) => (model = checked ? option : undefined)"
      :key="option.value">
      {{ option.label }}
    </ScalarCheckboxInput>
  </ScalarFormInputGroup>
</template>
