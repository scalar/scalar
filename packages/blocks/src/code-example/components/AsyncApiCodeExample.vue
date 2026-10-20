<script setup lang="ts">
import {
  ScalarCard,
  ScalarCardFooter,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components/card'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { ScalarWrappingText } from '@scalar/components/wrapping-text'
import type {
  AsyncApiDocument,
  AsyncApiMessageObject,
} from '@scalar/types/asyncapi/3.1'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import { computed, ref, watch } from 'vue'

import { getAsyncApiExampleContext } from '../helpers/get-asyncapi-example-context'
import { getGeneratedPayloadExample } from '../helpers/get-generated-payload-example'
import { getMessageExampleContent } from '../helpers/get-message-example-content'
import ExamplePicker from './ExamplePicker.vue'

const { document, operationName } = defineProps<{
  /** A workspace-resolved AsyncAPI 3.x document. */
  document: AsyncApiDocument
  /** Key in document.operations. */
  operationName: string
}>()

type PickerOptions = Record<string, { summary: string }>
type MessageExample = Exclude<
  NonNullable<AsyncApiMessageObject['examples']>[number],
  { $ref: string }
> & { key: string }
const context = computed<ReturnType<typeof getAsyncApiExampleContext>>(() =>
  getAsyncApiExampleContext(document, operationName),
)
const channelPathParts = computed(() =>
  (context.value?.channel?.address ?? operationName).split(/({[^}]+})/),
)

const selectedMessage = defineModel<string>('selectedMessage', { default: '' })
const selectedExample = ref<string>('')
const messages = computed<PickerOptions>(() =>
  Object.fromEntries(
    (context.value?.messages ?? []).map(({ name, message }) => [
      name,
      { summary: message.title || message.name || name },
    ]),
  ),
)
const message = computed<AsyncApiMessageObject | undefined>(
  () =>
    context.value?.messages.find(({ name }) => name === selectedMessage.value)
      ?.message,
)
const examples = computed<MessageExample[]>(() =>
  (message.value?.examples ?? []).flatMap((node, index) => {
    const example = getResolvedAsyncApiRef(node)
    return example?.payload !== undefined
      ? [{ key: String(index), ...example }]
      : []
  }),
)
const exampleOptions = computed<PickerOptions>(() =>
  Object.fromEntries(
    examples.value.map((example, index) => [
      example.key,
      { summary: example.name || example.summary || `Example ${index + 1}` },
    ]),
  ),
)
const example = computed<MessageExample | undefined>(() =>
  examples.value.find(({ key }) => key === selectedExample.value),
)
const messageLabel = computed<string>(
  () =>
    `Message: ${messages.value[selectedMessage.value]?.summary ?? 'Select a message'}`,
)
const exampleLabel = computed<string>(
  () =>
    `Message example: ${exampleOptions.value[selectedExample.value]?.summary ?? 'Select an example'}`,
)

// Keep selections valid when operations, messages, or the active document change.
watch(
  messages,
  (options) => {
    if (!Object.hasOwn(options, selectedMessage.value))
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
    if (!Object.hasOwn(options, selectedExample.value))
      selectedExample.value = Object.keys(options)[0] ?? ''
  },
  { immediate: true },
)
const content = computed(() =>
  getMessageExampleContent(
    example.value
      ? example.value.payload
      : message.value
        ? getGeneratedPayloadExample(message.value)
        : undefined,
    message.value?.contentType ?? document.defaultContentType,
  ),
)
</script>

<template>
  <ScalarCard
    class="request-card dark-mode min-w-0"
    label="Message example">
    <ScalarCardHeader
      class="flex-nowrap items-start gap-3 pr-2.5 [&_.scalar-card-header-title]:flex-1 [&_.scalar-card-header-title]:whitespace-normal [&>div:last-child]:shrink-0">
      <span class="sr-only">Message example for</span>
      <span
        class="font-code mr-1.5 uppercase"
        :class="
          context?.operation.action === 'send' ? 'text-blue' : 'text-green'
        "
        >{{ context?.operation.action }}</span
      >
      <span class="text-c-2 font-code min-w-0 font-semibold break-words">
        <template
          v-for="(part, index) in channelPathParts"
          :key="index">
          <span
            v-if="part.startsWith('{') && part.endsWith('}')"
            class="text-c-1 whitespace-nowrap"
            >{{ part }}</span
          >
          <ScalarWrappingText
            v-else
            :text="part" />
        </template>
      </span>
    </ScalarCardHeader>
    <ScalarCardSection class="custom-scroll flex flex-1 p-0">
      <div class="flex w-full flex-col">
        <p
          v-if="content?.structural"
          class="text-c-2 px-3 py-2 text-sm">
          Structure only; not encoded
        </p>
        <ScalarCodeBlock
          v-if="content"
          class="bg-b-2 h-full"
          :content="content.content"
          :lang="content.lang"
          lineNumbers />
        <p
          v-else
          class="text-c-2 p-4"
          role="status">
          No message payload example available.
        </p>
      </div>
    </ScalarCardSection>
    <ScalarCardFooter
      v-if="Object.keys(messages).length || examples.length"
      class="bg-b-3 relative flex shrink-0 flex-wrap items-center justify-end gap-2 p-1.5">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <ExamplePicker
          v-if="examples.length > 1"
          v-model="selectedExample"
          :aria-label="exampleLabel"
          :examples="exampleOptions" />
        <span
          v-else-if="examples.length === 1"
          class="text-c-2 min-w-0 truncate px-1.5 py-0.75 text-base">
          {{ exampleOptions[selectedExample]?.summary }}
        </span>
        <div class="ml-auto flex min-w-0 items-center">
          <ExamplePicker
            v-if="Object.keys(messages).length > 1"
            v-model="selectedMessage"
            :aria-label="messageLabel"
            :examples="messages" />
          <span
            v-else-if="Object.keys(messages).length === 1"
            class="text-c-2 min-w-0 truncate px-1.5 py-0.75 text-base">
            {{ messages[selectedMessage]?.summary }}
          </span>
        </div>
      </div>
    </ScalarCardFooter>
  </ScalarCard>
</template>

<style scoped>
.request-card {
  color: var(--scalar-color-1);
  font-size: var(--scalar-font-size-3);
}
</style>
