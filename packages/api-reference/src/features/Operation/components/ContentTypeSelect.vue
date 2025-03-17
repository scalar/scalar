<script setup lang="ts">
import {
  cva,
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
} from '@scalar/components'
import type { ContentType, RequestBody } from '@scalar/types/legacy'
import { computed, ref } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'

const prop = defineProps<{
  requestBody?: RequestBody
  defaultValue?: ContentType
}>()

const emit = defineEmits<{
  (e: 'selectContentType', payload: { contentType: ContentType }): void
}>()

const handleSelectContentType = (option: any) => {
  if (option?.id) {
    emit('selectContentType', { contentType: option.id as ContentType })
  }
}

const contentTypes = computed(() => {
  if (prop.requestBody?.content) {
    return Object.keys(prop.requestBody.content)
  }
  return []
})

const selectedContentType = ref<ContentType>(
  prop.defaultValue || (contentTypes.value[0] as ContentType),
)

const selectedOption = computed({
  get: () =>
    options.value.find((option) => option.id === selectedContentType.value),
  set: (option) => {
    if (option) {
      selectedContentType.value = option.id as ContentType
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
    v-if="prop?.requestBody && contentTypes.length > 1"
    v-model="selectedOption"
    class="font-normal"
    :options="options"
    placement="bottom-end"
    @update:modelValue="handleSelectContentType">
    <ScalarButton
      class="h-fit"
      :class="contentTypeSelect({ dropdown: true })"
      variant="ghost">
      <ScreenReader>Selected Content Type:</ScreenReader>
      <span>{{ selectedContentType }}</span>
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
    <span>{{ selectedContentType }}</span>
  </div>
</template>
