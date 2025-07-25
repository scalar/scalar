<script setup lang="ts">
import type { ScalarFloatingOptions } from '../ScalarFloating'
import ComboboxOptions from './ScalarComboboxOptions.vue'
import ComboboxPopover from './ScalarComboboxPopover.vue'
import type { Option, OptionGroup } from './types'

type Props = {
  options: Option[] | OptionGroup[]
  modelValue?: Option
  placeholder?: string
} & ScalarFloatingOptions

type SlotProps = {
  /** Whether or not the combobox is open */
  open: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()

defineSlots<{
  /** The reference element for the combobox */
  default(props: SlotProps): unknown
  /** A slot for contents before the combobox options */
  before?(props: SlotProps): unknown
  /** A slot for contents after the combobox options */
  after?(props: SlotProps): unknown
}>()

function handleUpdateModelValue(value: Option | undefined) {
  close()

  if (value) {
    emit('update:modelValue', value)
  }
}
</script>
<template>
  <ComboboxPopover
    :middleware="middleware"
    :offset="offset"
    :placement="placement ?? 'bottom-start'"
    :resize="resize"
    :target="target"
    :teleport="teleport">
    <template #default="{ open }">
      <slot :open="open" />
    </template>
    <template #popover="{ open }">
      <ComboboxOptions
        :modelValue="modelValue ? [modelValue] : []"
        :open="open"
        :options="options"
        :placeholder="placeholder"
        @update:modelValue="(v) => handleUpdateModelValue(v[0])">
        <template
          v-if="$slots.before"
          #before>
          <slot
            name="before"
            :open="open" />
        </template>
        <template
          v-if="$slots.after"
          #after>
          <slot
            name="after"
            :open="open" />
        </template>
      </ComboboxOptions>
    </template>
  </ComboboxPopover>
</template>
