<script setup lang="ts">
import { ExamplePicker } from '@scalar/blocks/code-example'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { computed, watch } from 'vue'

import { getGeneratedPayloadExample } from './helpers/get-generated-payload-example'
import { pickHeading } from './helpers/pick-heading'
import { resolveAsyncApiMessage } from './helpers/resolve-async-api-nodes'
import MessageExamples from './MessageExamples.vue'

const {
  document,
  messages,
  pickerLabel = 'Message example',
} = defineProps<{
  document: AsyncApiDocument
  messages: TraversedAsyncApiMessage[]
  pickerLabel?: string
}>()

const choices = computed(() =>
  messages.flatMap((entry) => {
    const message = resolveAsyncApiMessage(
      document,
      entry.channelName,
      entry.messageName,
    )
    return message
      ? [
          {
            id: entry.messageName,
            label: pickHeading(message.title, entry.title, entry.messageName),
            message,
          },
        ]
      : []
  }),
)
const selectedId = defineModel<string>('selectedMessage', { default: '' })
watch(
  choices,
  (values) => {
    if (!values.some(({ id }) => id === selectedId.value)) {
      selectedId.value = values[0]?.id ?? ''
    }
  },
  { immediate: true },
)
const selected = computed(() =>
  choices.value.find(({ id }) => id === selectedId.value),
)
const pickerOptions = computed(() =>
  Object.fromEntries(
    choices.value.map(({ id, label }) => [id, { summary: label }]),
  ),
)
const generatedPayload = computed<unknown>(() =>
  selected.value
    ? getGeneratedPayloadExample(selected.value.message)
    : undefined,
)
</script>

<template>
  <MessageExamples
    v-if="selected"
    :key="selected.id"
    :contentType="selected.message.contentType ?? document.defaultContentType"
    :examples="selected.message.examples"
    :generatedPayload="generatedPayload">
    <template #footer>
      <ExamplePicker
        v-if="choices.length > 1"
        v-model="selectedId"
        :aria-label="pickerLabel"
        class="-ml-1.5 h-auto!"
        :examples="pickerOptions" />
      <span
        v-else
        class="text-c-2 min-w-0 truncate py-0.75 text-base font-normal"
        >{{ selected.label }}</span
      >
    </template>
  </MessageExamples>
</template>
