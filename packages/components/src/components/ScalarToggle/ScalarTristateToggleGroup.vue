<script lang="ts">
/**
 * Scalar Tristate Toggle Group component
 *
 * A group of tristate toggle inputs, each independently unset, on, or off.
 */
export default {}
</script>
<script setup lang="ts">
import type { ScalarCheckboxOption } from '../ScalarCheckboxInput'
import { ScalarFormInputGroup } from '../ScalarForm'
import ScalarTristateToggleInput from './ScalarTristateToggleInput.vue'
import type { ScalarTristateOption } from './types'

const { options = [] } = defineProps<{
  options?: ScalarCheckboxOption[]
}>()

const model = defineModel<ScalarTristateOption[]>({ default: [] })

/** Looks up an option's current tristate value; undefined if it has no entry in the model. */
function getValue(option: ScalarCheckboxOption): boolean | undefined {
  return model.value.find((entry) => entry.value === option.value)?.checked
}

/** Upserts or removes an option's entry in the model based on its new tristate value. */
function setValue(option: ScalarCheckboxOption, checked: boolean | undefined) {
  const rest = model.value.filter((entry) => entry.value !== option.value)
  model.value = checked === undefined ? rest : [...rest, { ...option, checked }]
}
</script>
<template>
  <ScalarFormInputGroup>
    <ScalarTristateToggleInput
      v-for="option in options"
      :key="option.value"
      :modelValue="getValue(option)"
      @update:modelValue="(checked) => setValue(option, checked)">
      {{ option.label }}
    </ScalarTristateToggleInput>
  </ScalarFormInputGroup>
</template>
