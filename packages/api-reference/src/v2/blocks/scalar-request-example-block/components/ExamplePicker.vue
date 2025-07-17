<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/example'

const props = defineProps<{
  examples: Record<string, ExampleObject>
}>()

const selectedExampleKey = defineModel<string>({ required: true })

/** Generate label for an example */
const getLabel = (key: string | null) => {
  if (!key) {
    return 'Select an example'
  }

  const example = props.examples[key]
  return example?.summary ?? key
}

/** Handle example selection */
const selectExample = (key: string) => {
  selectedExampleKey.value = key
}

// For testing
defineExpose({
  getLabel,
  selectedExampleKey,
})
</script>

<template>
  <ScalarDropdown
    placement="bottom"
    resize>
    <ScalarButton
      data-testid="example-picker"
      class="text-c-1 hover:bg-b-2 flex h-full w-fit gap-1.5 px-1.5 py-0.75 font-normal"
      fullWidth
      variant="ghost">
      <span>{{ getLabel(selectedExampleKey) }}</span>
      <ScalarIconCaretDown />
    </ScalarButton>
    <template #items>
      <ScalarDropdownItem
        v-for="(_, key) in examples"
        :key="key"
        @click="selectExample(key)">
        {{ getLabel(key) }}
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>
