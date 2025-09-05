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
  Option,
  OptionGroup,
  OptionsOrGroups,
} from './types'

defineProps<
  {
    options: OptionsOrGroups<O, G>
    placeholder?: string
  } & ScalarFloatingOptions
>()

const model = defineModel<O>()

const emit = defineEmits<ComboboxEmits>()

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
        :modelValue="model ? [model] : []"
        :open
        :options
        :placeholder
        @update:modelValue="(v) => (close(), (model = v[0]))"
        @add="() => (close(), emit('add'))">
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
