<script setup lang="ts">
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components'
import { ScalarIconCaretUpDown } from '@scalar/icons'
import type { SpecConfiguration } from '@scalar/types/api-reference'
import { computed } from 'vue'

const { options, modelValue } = defineProps<{
  options?: SpecConfiguration[]
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// Show the selector if there are multiple options
const showSelector = computed(() => options && options?.length > 1)

const listboxOptions = computed(
  () =>
    options?.map((option, index) => ({
      id: String(index),
      // Get the display text for the selected option
      label: option.title || option.slug || `API #${index + 1}`,
    })) || [],
)

const selectedOption = computed({
  get: () => listboxOptions.value.find(({ id }) => id === String(modelValue)),
  set: (opt: ScalarListboxOption) => emit('update:modelValue', Number(opt.id)),
})
</script>

<template>
  <template v-if="showSelector">
    <div class="document-selector -mb-1 p-3 pb-0">
      <ScalarListbox
        v-model="selectedOption"
        :options="listboxOptions"
        resize>
        <button
          class="group/dropdown-label hover:bg-b-2 text-c-2 flex h-8 w-full cursor-pointer items-center rounded border px-2 py-1.75"
          type="button">
          <ScalarIconCaretUpDown class="mr-1 size-4 text-current" />
          <span class="text-c-1 overflow-hidden text-base text-ellipsis">
            {{ selectedOption?.label || 'Select API' }}
          </span>
        </button>
      </ScalarListbox>
    </div>
  </template>
</template>
