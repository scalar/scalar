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
        multiselect
        :open
        :options
        :placeholder>
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
