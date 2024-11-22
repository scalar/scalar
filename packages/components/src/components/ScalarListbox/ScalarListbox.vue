<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOptions,
} from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'
import ScalarListboxOption from './ScalarListboxItem.vue'
import type { Option } from './types'

type SingleSelectListboxProps = {
  multiple?: false
  modelValue?: Option
}

type MultipleSelectListboxProps = {
  multiple: true
  modelValue?: Option[]
}

defineProps<
  {
    options: Option[]
    id?: string
    label?: string
  } & (SingleSelectListboxProps | MultipleSelectListboxProps) &
    FloatingOptions
>()

defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()

defineOptions({ inheritAttrs: false })
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
      :isOpen="open ?? isOpen"
      :middleware="middleware"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :target="target"
      :teleport="teleport">
      <ListboxButton
        :id="id"
        as="template"
        class="justify-start focus:outline-none focus-visible:ring-1 focus-visible:ring-c-accent">
        <slot :open="open" />
      </ListboxButton>
      <template #floating="{ width }">
        <!-- Background container -->
        <div
          v-bind="$attrs"
          class="relative flex max-h-[inherit] w-40 rounded border text-sm"
          :style="{ width }">
          <!-- Scroll container -->
          <div class="custom-scroll min-h-0 flex-1">
            <!-- Options list -->
            <ListboxOptions class="flex flex-col p-0.75">
              <ScalarListboxOption
                v-for="option in options"
                :key="option.id"
                :option="option"
                :style="multiple ? 'checkbox' : 'radio'" />
            </ListboxOptions>
          </div>
          <div
            class="absolute inset-0 -z-1 rounded bg-b-1 shadow-md brightness-lifted" />
        </div>
      </template>
    </ScalarFloating>
  </Listbox>
</template>
