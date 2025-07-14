<script setup lang="ts">
import {
  ScalarButton,
  ScalarCombobox,
  type ScalarComboboxOption,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/example'
import { computed } from 'vue'

const props = defineProps<{
  examples: Record<string, ExampleObject>
}>()

const selectedExampleKey = defineModel<string>({ required: true })

/** Generate the options for the combobox */
const exampleOptions = computed<ScalarComboboxOption[]>(() => {
  return Object.keys(props.examples).map((key) => ({
    id: key,
    label: getLabel(key),
  }))
})

/** Get the currently selected example */
const selectedExample = computed<ScalarComboboxOption>(
  () =>
    exampleOptions.value.find(
      (option) => option.id === selectedExampleKey.value,
    ) ?? exampleOptions.value[0],
)

/** Generate label for an example */
const getLabel = (key: string | null) => {
  if (!key) {
    return 'Select an example'
  }

  const example = props.examples[key]
  return example?.summary ?? key
}

/** Handle example selection */
const selectExample = (option: ScalarComboboxOption) => {
  selectedExampleKey.value = option.id
}

// For testing
defineExpose({
  getLabel,
  selectedExample,
  selectedExampleKey,
})
</script>

<template>
  <ScalarCombobox
    class="max-h-80"
    :modelValue="selectedExample"
    :options="exampleOptions"
    teleport
    placement="bottom-start"
    @update:modelValue="selectExample">
    <ScalarButton
      data-testid="example-picker"
      class="text-c-1 hover:bg-b-2 flex h-full w-fit gap-1.5 px-1.5 py-0.75 font-normal"
      fullWidth
      variant="ghost">
      <span>{{ selectedExample?.label || 'Select an example' }}</span>
      <ScalarIconCaretDown />
    </ScalarButton>
  </ScalarCombobox>
</template>
