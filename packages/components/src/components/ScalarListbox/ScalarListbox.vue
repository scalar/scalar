<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOptions,
} from '@headlessui/vue'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import {
  ScalarFloating,
  ScalarFloatingBackdrop,
  type ScalarFloatingOptions,
} from '../ScalarFloating'
import ScalarListboxOption from './ScalarListboxItem.vue'
import type { Option } from './types'

type SingleSelectListboxProps = {
  multiple?: false | undefined
  modelValue?: Option | undefined
}

type MultipleSelectListboxProps = {
  multiple: true
  modelValue?: Option[] | undefined
}

defineProps<
  {
    options: Option[]
    id?: string
    label?: string
  } & (SingleSelectListboxProps | MultipleSelectListboxProps) &
    ScalarFloatingOptions
>()

defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()

defineSlots<{
  /** The reference element for the listbox */
  default(props: {
    /** Whether or not the listbox is open */
    open: boolean
  }): any
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <Listbox
    v-slot="{ open }"
    :modelValue="modelValue"
    :multiple="multiple"
    @update:modelValue="(v) => $emit('update:modelValue', v)">
    <ListboxLabel
      v-if="label"
      class="sr-only">
      {{ label }}
    </ListboxLabel>
    <ScalarFloating
      v-bind="$props"
      :placement="placement ?? 'bottom-start'">
      <ListboxButton
        :id="id"
        as="template"
        class="justify-start focus:outline-none focus-visible:ring-1 focus-visible:ring-c-accent">
        <slot :open="open" />
      </ListboxButton>
      <template #floating="{ width }">
        <!-- Background container -->
        <div
          v-if="open"
          :style="{ width }"
          v-bind="cx('relative flex max-h-[inherit] w-40 rounded text-sm')">
          <!-- Scroll container -->
          <div class="custom-scroll min-h-0 flex-1">
            <!-- Options list -->
            <ListboxOptions
              class="flex flex-col gap-0.75 p-0.75 -outline-offset-1">
              <ScalarListboxOption
                v-for="option in options"
                :key="option.id"
                :option="option"
                :style="multiple ? 'checkbox' : 'radio'" />
            </ListboxOptions>
          </div>
          <ScalarFloatingBackdrop />
        </div>
      </template>
    </ScalarFloating>
  </Listbox>
</template>
