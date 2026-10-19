<script setup lang="ts">
import {
  ScalarCard,
  ScalarCardFooter,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components/card'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import { computed, ref, watch } from 'vue'

import { formatLanguage } from '../helpers/format-language'
import { generateWebSocketSnippet } from '../helpers/generate-websocket-snippet'
import { getAsyncApiExampleContext } from '../helpers/get-asyncapi-example-context'
import ExamplePicker from './ExamplePicker.vue'

const { document, operationName, selectedServer } = defineProps<{
  /** A workspace-resolved AsyncAPI 3.x document. */
  document: AsyncApiDocument
  /** Key in document.operations. */
  operationName: string
  /** Optional server name, restricted to the operation channel servers. */
  selectedServer?: string
}>()

const context = computed(() =>
  getAsyncApiExampleContext(document, operationName, selectedServer),
)
const selectedMessage = ref('')
const selectedExample = ref('')
const selectedSample = ref('')
const messages = computed(() =>
  Object.fromEntries(
    (context.value?.messages ?? []).map(({ name, message }) => [
      name,
      { summary: message.title || message.name || name },
    ]),
  ),
)
const message = computed(
  () =>
    context.value?.messages.find(({ name }) => name === selectedMessage.value)
      ?.message,
)
const examples = computed(() =>
  (message.value?.examples ?? []).flatMap((node, index) => {
    const example = getResolvedAsyncApiRef(node)
    return example ? [{ key: String(index), ...example }] : []
  }),
)
const exampleOptions = computed(() =>
  Object.fromEntries(
    examples.value.map((example, index) => [
      example.key,
      { summary: example.name || example.summary || `Example ${index + 1}` },
    ]),
  ),
)
const example = computed(() =>
  examples.value.find(({ key }) => key === selectedExample.value),
)
const samples = computed(() => [
  ...(context.value?.samples ?? []).map((sample, index) => ({
    ...sample,
    key: `custom/${index}`,
    title: sample.label || formatLanguage(sample.lang) || sample.lang,
  })),
  ...(context.value?.server
    ? [
        {
          key: 'js/websocket',
          title: 'JavaScript WebSocket',
          lang: 'javascript',
          source: undefined,
        },
      ]
    : []),
])
const sampleOptions = computed(() =>
  Object.fromEntries(
    samples.value.map((sample) => [sample.key, { summary: sample.title }]),
  ),
)
const sample = computed(() =>
  samples.value.find(({ key }) => key === selectedSample.value),
)

// Keep selections valid when operations, messages, or the active document change.
watch(
  messages,
  (options) => {
    if (!(selectedMessage.value in options))
      selectedMessage.value = Object.keys(options)[0] ?? ''
  },
  { immediate: true },
)
watch([selectedMessage, () => operationName], () => {
  selectedExample.value = Object.keys(exampleOptions.value)[0] ?? ''
})
watch(
  exampleOptions,
  (options) => {
    if (!(selectedExample.value in options))
      selectedExample.value = Object.keys(options)[0] ?? ''
  },
  { immediate: true },
)
watch(
  sampleOptions,
  (options) => {
    if (!(selectedSample.value in options))
      selectedSample.value = Object.keys(options)[0] ?? ''
  },
  { immediate: true },
)

const content = computed(() => {
  if (sample.value?.source !== undefined) return sample.value.source
  const current = context.value
  if (!current?.server?.connectionUrl || !sample.value) return undefined
  return generateWebSocketSnippet({
    url: current.server.connectionUrl,
    action: current.operation.action,
    payload: example.value?.payload,
    contentType: message.value?.contentType ?? document.defaultContentType,
    hasSecurity: Boolean(
      current.operation.security?.length ||
      current.server.server.security?.length,
    ),
    hasHeaders: Boolean(message.value?.headers || example.value?.headers),
    hasReply: Boolean(current.operation.reply),
  })
})
</script>

<template>
  <ScalarCard
    class="min-w-0"
    label="Code example">
    <ScalarCardHeader>
      <span class="font-code truncate"
        >{{ context?.operation.action }}
        {{ context?.channel?.address ?? operationName }}</span
      >
    </ScalarCardHeader>
    <ScalarCardSection>
      <ScalarCodeBlock
        v-if="content !== undefined"
        class="bg-b-2 w-full"
        :content="content"
        copy="always"
        :lang="sample?.lang" />
      <p
        v-else
        class="text-c-2 p-4"
        role="status">
        No code sample available. Add an authored sample or a WebSocket server.
      </p>
    </ScalarCardSection>
    <ScalarCardFooter class="flex flex-wrap gap-2">
      <ExamplePicker
        v-if="samples.length"
        v-model="selectedSample"
        aria-label="Code sample"
        :examples="sampleOptions" />
      <template v-if="selectedSample === 'js/websocket'">
        <ExamplePicker
          v-if="Object.keys(messages).length"
          v-model="selectedMessage"
          aria-label="Message"
          :examples="messages" />
        <ExamplePicker
          v-if="examples.length"
          v-model="selectedExample"
          aria-label="Message example"
          :examples="exampleOptions" />
      </template>
    </ScalarCardFooter>
  </ScalarCard>
</template>
