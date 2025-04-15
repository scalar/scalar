<script setup lang="ts">
import {
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
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
        <div
          class="group/dropdown-label hover:bg-b-2 text-c-2 py-1.75 pl-1.75 flex w-full cursor-pointer items-center rounded border"
          tabindex="0">
          <ScalarIcon
            class="mr-1.25 min-w-4"
            icon="Versions"
            size="sm"
            thickness="2" />
          <span
            class="text-c-1 overflow-hidden truncate text-ellipsis text-sm font-medium">
            {{ selectedOption?.label || 'Select API' }}
          </span>
          <ScalarIcon
            class="group-hover/dropdown-label:text-c-1 ml-auto mr-2"
            icon="ChevronDown"
            size="sm"
            thickness="2" />
        </div>
      </ScalarListbox>
    </div>
  </template>
</template>
