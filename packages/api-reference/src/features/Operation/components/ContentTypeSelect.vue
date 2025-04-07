<script setup lang="ts">
import {
  cva,
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
} from '@scalar/components'
import type { Operation } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'
import { useRequestBodyContent } from '@/features/Operation/hooks/useRequestBodyContent'

const { requestBody, modelValue } = defineProps<{
  requestBody?: Operation['requestBody']
  modelValue?: string | undefined
}>()

const { availableContentTypes } = useRequestBodyContent(requestBody)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const updateModelValue = (option: any) => {
  console.log('updateModelValue', option)
  if (option?.id) {
    emit('update:modelValue', option.id)
  }
}

const selectedOption = computed({
  get: () => options.value.find((option) => option.id === modelValue),
  set: (option) => {
    if (option) {
      emit('update:modelValue', option.id)
    }
  },
})

const options = computed(() => {
  return availableContentTypes.value.map((type) => ({
    id: type,
    label: type,
  }))
})

// Content type select style variant based on dropdown availability
const contentTypeSelect = cva({
  base: 'font-normal text-c-2 bg-b-2 py-0.75 flex cursor-pointer items-center gap-1 rounded-full text-xs',
  variants: {
    dropdown: {
      true: 'border hover:text-c-1 pl-2 pr-1.5',
      false: 'px-2',
    },
  },
})
</script>
<template>
  <ScalarListbox
    v-if="availableContentTypes.length > 1"
    v-model="selectedOption"
    class="font-normal"
    :options="options"
    placement="bottom-end">
    <ScalarButton
      class="h-fit"
      :class="contentTypeSelect({ dropdown: true })"
      variant="ghost">
      <ScreenReader>Selected Content Type:</ScreenReader>
      <span>{{ modelValue }}</span>
      <ScalarIcon
        class="ui-open:rotate-180 ml-auto"
        icon="ChevronDown"
        size="sm"
        thickness="2" />
    </ScalarButton>
  </ScalarListbox>
  <div
    v-else
    :class="contentTypeSelect({ dropdown: false })"
    tabindex="0">
    <span>{{ modelValue }}</span>
  </div>
</template>
