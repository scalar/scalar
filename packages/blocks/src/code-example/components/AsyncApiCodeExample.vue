<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import {
  ScalarCard,
  ScalarCardFooter,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components/card'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import {
  ScalarCombobox,
  type ScalarComboboxOption,
} from '@scalar/components/combobox'
import { ScalarIconCaretDown } from '@scalar/icons'
import { generateMessageSnippet } from '@scalar/snippetz/messages'
import type {
  AsyncApiDocument,
  AsyncApiMessageObject,
} from '@scalar/types/asyncapi/3.1'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import type {
  MergedSecuritySchemes,
  SecuritySchemeObjectSecret,
} from '@scalar/workspace-store/request-example'
import { computed, ref, watch } from 'vue'

import { formatLanguage } from '../helpers/format-language'
import { getAsyncApiExampleContext } from '../helpers/get-asyncapi-example-context'
import { getAsyncApiExampleSecurity } from '../helpers/get-asyncapi-example-security'
import { getSecrets } from '../helpers/get-secrets'
import { processSecuritySchemes } from '../helpers/operation-to-har/process-security-schemes'
import ExamplePicker from './ExamplePicker.vue'

const { document, operationName, selectedServer, authStore, securitySchemes } =
  defineProps<{
    /** A workspace-resolved AsyncAPI 3.x document. */
    document: AsyncApiDocument
    /** Key in document.operations. */
    operationName: string
    /** Optional server name, restricted to the operation channel servers. */
    selectedServer?: string
    /** Selected credentials shared with the auth controls. */
    authStore?: AuthStore
    /** Schemes merged with reference configuration overrides. */
    securitySchemes?: MergedSecuritySchemes
  }>()

type PickerOptions = Record<string, { summary: string }>
type MessageExample = Exclude<
  NonNullable<AsyncApiMessageObject['examples']>[number],
  { $ref: string }
> & { key: string }
type CodeSample = {
  key: string
  title: string
  lang: string
  source: string | undefined
}

const context = computed<ReturnType<typeof getAsyncApiExampleContext>>(() =>
  getAsyncApiExampleContext(document, operationName, selectedServer),
)
const selectedMessage = ref<string>('')
const selectedExample = ref<string>('')
const selectedSample = ref<string>('')
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
    return example ? [{ key: String(index), ...example }] : []
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
const samples = computed<CodeSample[]>(() => [
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
const sampleOptions = computed<PickerOptions>(() =>
  Object.fromEntries(
    samples.value.map((sample) => [sample.key, { summary: sample.title }]),
  ),
)
const sample = computed<CodeSample | undefined>(() =>
  samples.value.find(({ key }) => key === selectedSample.value),
)

const sampleChoices = computed<ScalarComboboxOption[]>(() =>
  samples.value.map(({ key, title }) => ({ id: key, label: title })),
)
const selectedChoice = computed<ScalarComboboxOption | undefined>(() =>
  sampleChoices.value.find(({ id }) => id === selectedSample.value),
)

const sampleLabel = computed<string>(
  () => `Code sample: ${sample.value?.title ?? 'Select a sample'}`,
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
watch(
  sampleOptions,
  (options) => {
    if (!Object.hasOwn(options, selectedSample.value))
      selectedSample.value = Object.keys(options)[0] ?? ''
  },
  { immediate: true },
)

const selectedSecurity = computed<SecuritySchemeObjectSecret[]>(() =>
  getAsyncApiExampleSecurity(
    document,
    context.value,
    authStore,
    securitySchemes,
  ),
)
const credentialValues = computed<string[]>(() =>
  getSecrets(selectedSecurity.value).flatMap((secret) => [
    secret,
    encodeURIComponent(secret),
    new URLSearchParams({ value: secret }).toString().slice(6),
  ]),
)

const content = computed<string | undefined>(() => {
  if (sample.value?.source !== undefined) return sample.value.source
  const current = context.value
  if (!current?.server?.connectionUrl || !sample.value) return undefined
  const auth = processSecuritySchemes(selectedSecurity.value)
  return generateMessageSnippet({
    query: auth.queryString,
    cookies: auth.cookies,
    protocol: 'websocket',
    language: 'javascript',
    url: current.server.connectionUrl,
    action: current.operation.action,
    payload: example.value?.payload,
    contentType: message.value?.contentType ?? document.defaultContentType,
  })
})
</script>

<template>
  <ScalarCard
    class="request-card dark-mode min-w-0"
    label="Code example">
    <ScalarCardHeader class="pr-2.5">
      <span class="sr-only">Code example for</span>
      <span
        class="font-code mr-1.5 uppercase"
        :class="
          context?.operation.action === 'send' ? 'text-blue' : 'text-green'
        "
        >{{ context?.operation.action }}</span
      >
      <span class="text-c-2 font-code min-w-0 truncate">{{
        context?.channel?.address ?? operationName
      }}</span>
      <template #actions>
        <ScalarCombobox
          v-if="samples.length > 1"
          :modelValue="selectedChoice"
          :options="sampleChoices"
          placement="bottom-end"
          teleport
          @update:modelValue="selectedSample = $event?.id ?? ''">
          <ScalarButton
            :aria-label="sampleLabel"
            class="text-c-2 hover:text-c-1 flex h-full w-fit gap-1.5 px-0.5 py-0 text-base font-normal"
            variant="ghost">
            {{ sample?.title }}
            <ScalarIconCaretDown
              class="ui-open:rotate-180 mt-px size-3 transition-transform duration-100"
              weight="bold" />
          </ScalarButton>
        </ScalarCombobox>
        <span
          v-else
          class="text-c-2 flex h-full w-fit items-center px-0.5 py-0 text-base font-normal"
          >{{ sample?.title }}</span
        >
      </template>
    </ScalarCardHeader>
    <ScalarCardSection class="custom-scroll flex flex-1 p-0">
      <div class="flex w-full flex-col">
        <ScalarCodeBlock
          v-if="content !== undefined"
          class="bg-b-2 h-full"
          :content="content"
          :hideCredentials="
            selectedSample === 'js/websocket' ? credentialValues : []
          "
          :lang="sample?.lang"
          lineNumbers />
        <p
          v-else
          class="text-c-2 p-4"
          role="status">
          No code sample available. Add an authored sample or a WebSocket
          server.
        </p>
      </div>
    </ScalarCardSection>
    <ScalarCardFooter
      v-if="
        selectedSample === 'js/websocket' &&
        (Object.keys(messages).length || examples.length)
      "
      class="bg-b-3 relative flex shrink-0 flex-wrap items-center justify-end gap-2 p-1.5">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
