<!-- prettier-ignore-attribute generic -->
<script
  setup
  lang="ts"
  generic=" O extends Option = Option, G extends OptionGroup<O> = OptionGroup<O> ">
import type { ScalarFloatingOptions } from '../ScalarFloating'
import ComboboxOptions from './ScalarComboboxOptions.vue'
import ComboboxPopover from './ScalarComboboxPopover.vue'
import type {
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
        @update:modelValue="(v) => (close(), (model = v[0]))">
        <!-- Pass through the combobox slots -->
        <template
          v-if="$slots.before"
          #before>
          <slot name="before" />
        </template>
        <template
          v-if="$slots.option"
          #option="{ option }">
          <slot
            name="option"
            :option />
        </template>
        <template
          v-if="$slots.group"
          #group="{ group }">
          <slot
            name="group"
            :group />
        </template>
        <template
          v-if="$slots.after"
          #after>
          <slot name="after" />
        </template>
      </ComboboxOptions>
    </template>
  </ComboboxPopover>
</template>
