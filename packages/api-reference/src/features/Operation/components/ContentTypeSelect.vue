<script setup lang="ts">
import { cva, ScalarButton, ScalarListbox } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'

const { content } = defineProps<{
  content: Record<string, MediaTypeObject> | undefined
}>()

/** The selected content type with two-way binding */
const selectedContentType = defineModel<string>({ required: true })

const contentTypes = computed(() => Object.keys(content ?? {}))

const selectedOption = computed({
  get: () =>
    options.value.find((option) => option.id === selectedContentType.value),
  set: (option) => {
    if (option) {
      selectedContentType.value = option.id
    }
  },
})

const options = computed(() => {
  return contentTypes.value.map((type) => ({
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
    v-if="contentTypes.length > 1"
    v-model="selectedOption"
    :options="options"
    placement="bottom-end">
    <ScalarButton
      class="h-fit"
      :class="contentTypeSelect({ dropdown: true })"
      variant="ghost">
      <ScreenReader>Selected Content Type:</ScreenReader>
      <span>{{ selectedContentType }}</span>
      <ScalarIconCaretDown
        class="ui-open:rotate-180 size-2.75 transition-transform duration-100"
        weight="bold" />
    </ScalarButton>
  </ScalarListbox>
  <div
    v-else
    class="selected-content-type"
    :class="contentTypeSelect({ dropdown: false })"
    tabindex="0">
    <span>{{ selectedContentType }}</span>
  </div>
</template>
