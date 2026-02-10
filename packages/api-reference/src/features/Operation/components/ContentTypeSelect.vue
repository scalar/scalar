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

defineOptions({ inheritAttrs: false })

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
  base: 'font-normal text-c-2 bg-b-1 py-1 flex items-center gap-1 rounded-full text-xs leading-none border',
  variants: {
    dropdown: {
      true: 'hover:text-c-1 pl-2 pr-1.5 font-medium cursor-pointer',
      false: 'px-2',
    },
  },
})
</script>
<template>
  <ScalarListbox
    v-if="contentTypes.length > 1"
    v-slot="{ open }"
    v-model="selectedOption"
    :options="options"
    placement="bottom-end"
    teleport
    @click.stop>
    <ScalarButton
      class="h-fit"
      :class="contentTypeSelect({ dropdown: true })"
      variant="ghost"
      v-bind="$attrs"
      @click.stop>
      <ScreenReader>Selected Content Type:</ScreenReader>
      <span>{{ selectedContentType }}</span>
      <ScalarIconCaretDown
        class="size-2.75 transition-transform duration-100"
        :class="{ 'rotate-180': open }"
        weight="bold" />
    </ScalarButton>
  </ScalarListbox>
  <div
    v-else
    class="selected-content-type"
    :class="contentTypeSelect({ dropdown: false })"
    v-bind="$attrs"
    tabindex="0">
    <span>{{ selectedContentType }}</span>
  </div>
</template>
