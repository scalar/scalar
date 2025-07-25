<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.1/strict/media-header-encoding'

const { examples } = defineProps<{
  examples: MediaTypeObject['examples']
}>()

const selectedExampleKey = defineModel<string>({
  required: true,
})

/** Generate label for an example */
const getLabel = (key: string | null) => {
  if (!key) {
    return 'Select an example'
  }

  // Use the summary, if available, fallback to the key
  return examples?.[key]?.summary ?? key
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
      class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-1.5 py-0.75 text-base font-normal"
      fullWidth
      variant="ghost">
      <span>{{ getLabel(selectedExampleKey) }}</span>
      <ScalarIconCaretDown
        weight="bold"
        class="ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100" />
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
