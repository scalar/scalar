<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
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
  <ScalarDropdown placement="bottom-start">
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
        <div
          class="flex h-4 w-4 items-center justify-center rounded-full p-[3px]"
          :class="
            selectedExampleKey === key
              ? 'bg-c-accent text-b-1'
              : 'shadow-border text-transparent'
          ">
          <ScalarIcon
            class="size-2.5"
            icon="Checkmark"
            thickness="3" />
        </div>
        <span class="overflow-hidden text-ellipsis">{{ getLabel(key) }}</span>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>
