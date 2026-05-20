<script lang="ts">
/**
 * Scalar Combobox component
 *
 * A searchable select input with support for filtering, option groups,
 * and custom option rendering.
 *
 * @example
 * <ScalarCombobox v-model="selected" :options="options">
 *   <ScalarButton>{{ selected?.label ?? 'Select' }}</ScalarButton>
 * </ScalarCombobox>
 */
export default {}
</script>

<!-- prettier-ignore-attribute generic -->
<script
  setup
  lang="ts"
  generic="O extends Option = Option, G extends OptionGroup<O> = OptionGroup<O>">
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

const model = defineModel<O>()

defineSlots<ComboboxSlots<O, G>>()
</script>
<template>
  <ComboboxPopover
    :middleware
    :offset
    :placement="placement ?? 'bottom-start'"
    :resize
    :target
    :teleport>
    <template #default="{ open }">
      <slot :open />
    </template>
    <template #popover="{ open, close }">
      <ComboboxOptions
        :filterFn
        :modelValue="model ? [model] : []"
        :open
        :options
        :placeholder
        @add="() => (close(), emit('add'))"
        @update:modelValue="(v) => (close(), (model = v[0]))">
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
