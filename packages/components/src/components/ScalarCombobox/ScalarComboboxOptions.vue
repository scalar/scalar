<script setup lang="ts">
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/vue'
import { computed, ref, watch } from 'vue'

import { cva, cx } from '../../cva'
import { ScalarIcon } from '../ScalarIcon'
import type { Option } from './types'

const props = defineProps<{
  options: Option[]
  modelValue?: Option
  placeholder?: string
  open?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()

defineOptions({ inheritAttrs: false })

const query = ref('')

const filtered = computed<Option[]>(() =>
  query.value === ''
    ? props.options
    : props.options.filter((option) => {
        return option.label.toLowerCase().includes(query.value.toLowerCase())
      }),
)

// Clear the query on open and close
watch(
  () => props.open,
  () => (query.value = ''),
)

const variants = cva({
  base: [
    // Layout
    'group',
    'flex min-w-0 items-center gap-1.5 rounded px-2 py-1.5 text-left',
    'first-of-type:mt-0.75 last-of-type:mb-0.75',
    // Text / background style
    'truncate bg-transparent text-c-1',
    // Interaction
    'cursor-pointer hover:bg-b-2',
  ],
  variants: {
    selected: { true: 'text-c-1' },
    active: { true: 'bg-b-2' },
    disabled: { true: 'pointer-events-none opacity-50' },
  },
})
</script>
<template>
  <Combobox
    :modelValue="modelValue"
    @update:modelValue="(v) => $emit('update:modelValue', v)">
    <div class="flex items-center gap-2 px-3 py-2.5">
      <ScalarIcon
        class="text-c-3"
        icon="Search"
        size="sm" />
      <ComboboxInput
        class="h-3.5 min-w-0 flex-1 rounded-none border-0 p-0 text-c-1 outline-none"
        :placeholder="placeholder"
        @change="query = $event.target.value" />
    </div>

    <ComboboxOptions
      v-show="filtered.length"
      class="border-t p-0.75"
      static>
      <ComboboxOption
        v-for="option in filtered"
        :key="option.id"
        v-slot="{ active, selected }"
        as="template"
        :disabled="option.disabled"
        :value="option">
        <li
          :class="
            cx(variants({ active, selected, disabled: option.disabled }))
          ">
          <div
            class="flex size-4 items-center justify-center rounded-full p-0.75 group-hover:shadow-border"
            :class="selected ? 'bg-blue text-b-1' : 'text-transparent'">
            <!-- Icon needs help to be optically centered (╥﹏╥) -->
            <ScalarIcon
              class="relative top-[0.5px] size-2.5"
              icon="Checkmark"
              thickness="2.5" />
          </div>
          <span class="inline-block min-w-0 flex-1 truncate text-c-1">{{
            option.label
          }}</span>
        </li>
      </ComboboxOption>
    </ComboboxOptions>
  </Combobox>
</template>
