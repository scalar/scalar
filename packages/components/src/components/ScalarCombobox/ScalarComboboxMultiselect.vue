<!-- prettier-ignore-attribute generic -->
<script
  setup
  lang="ts"
  generic=" O extends Option = Option, G extends OptionGroup<O> = OptionGroup<O> ">
import { ref } from 'vue'

import type { ScalarFloatingOptions } from '../ScalarFloating'
import ComboboxOptions from './ScalarComboboxOptions.vue'
import ComboboxPopover from './ScalarComboboxPopover.vue'
import type {
  ComboboxEmits,
  ComboboxSlots,
  FilterFunction,
  Option,
  OptionGroup,
  OptionsOrGroups,
} from './types'

defineProps<
  {
    /** The options to display in the combobox */
    options: OptionsOrGroups<O, G>
    /** The placeholder text to display in the combobox */
    placeholder?: string
    /** A function to filter the options based on a query,
     * if not provided, the options will be filtered by option label
     *
     * @see {@link FilterFunction} for more information
     */
    filterFn?: FilterFunction<O, G>
  } & ScalarFloatingOptions
>()

const emit = defineEmits<ComboboxEmits>()

const model = defineModel<O[]>({ default: [] })

defineSlots<ComboboxSlots<O, G>>()

/** Propagate up the popover ref */
const comboboxPopoverRef = ref<typeof ComboboxPopover | null>(null)

defineExpose({ comboboxPopoverRef })
</script>
<template>
  <ComboboxPopover
    ref="comboboxPopoverRef"
    :middleware="middleware"
    :offset="offset"
    :placement="placement ?? 'bottom-start'"
    :resize="resize"
    :target="target"
    :teleport="teleport">
    <template #default="{ open }">
      <slot :open />
    </template>
    <template #popover="{ open }">
      <ComboboxOptions
        v-if="options?.length"
        v-model="model"
        :filterFn
        multiselect
        :open
        :options
        :placeholder
        @add="emit('add')">
        <!-- Pass through the combobox slots -->
        <template
          v-if="$slots.option"
          #option="props">
          <slot
            name="option"
            v-bind="props" />
        </template>
        <template
          v-if="$slots.group"
          #group="props">
          <slot
            name="group"
            v-bind="props" />
        </template>
        <template
          v-if="$slots.add"
          #add="props">
          <slot
            name="add"
            v-bind="props" />
        </template>
      </ComboboxOptions>
    </template>
  </ComboboxPopover>
</template>
