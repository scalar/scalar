<script setup lang="ts">
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/vue'

import { ScalarDropdownButton, ScalarFloating } from '@scalar/components'

defineProps<{
  completionOptions: string[]
}>()

const emit = defineEmits<{
  (e: 'select', value: string): void
}>()

const query = defineModel<string>({ default: '' })
</script>
<template>
  <Combobox
    :modelValue="query"
    nullable
    @update:modelValue="
      (value) => {
        if (typeof value === 'string' && value.length > 0) {
          emit('select', value)
        }
      }
    ">
    <ScalarFloating resize>
      <ComboboxInput
        autofocus
        class="pl-8.5 focus:border-b-1 w-full resize-none border border-transparent py-1.5 text-sm outline-none"
        :displayValue="() => query"
        placeholder="Type to search for a document..."
        @change="(evt) => (query = evt.target.value)" />
      <template v-if="true">
        <ComboboxOptions
          class="custom-scroll by max-h-40"
          static>
          <ComboboxOption
            v-for="str in completionOptions"
            :key="str"
            v-slot="{ active, selected }"
            as="template"
            class="h-8 w-full"
            :value="str">
            <ScalarDropdownButton
              :active="active"
              :selected="selected">
              {{ str }}
            </ScalarDropdownButton>
          </ComboboxOption>
        </ComboboxOptions>
      </template>
    </ScalarFloating>
  </Combobox>
</template>
