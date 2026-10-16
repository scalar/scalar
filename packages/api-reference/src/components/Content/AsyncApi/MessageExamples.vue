<script setup lang="ts">
import { ExamplePicker } from '@scalar/blocks/code-example'
import {
  ScalarCard,
  ScalarCardFooter,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components/card'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarVirtualCodeBlock } from '@scalar/components/virtual-code-block'
import { iterateTitle } from '@scalar/helpers/string/iterate-title'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed, ref, watch } from 'vue'

import { useLocalization } from '@/features/localization'

import { getMessageExampleContent } from './helpers/get-message-example-content'

const {
  examples = [],
  generatedPayload,
  contentType,
} = defineProps<{
  examples?: AsyncApiMessageObject['examples']
  generatedPayload?: unknown
  contentType?: string
}>()

const { translate } = useLocalization()

/** Array positions keep duplicate names and generated labels from overwriting another example. */
const availableExamples = computed(() => {
  const candidates =
    generatedPayload === undefined
      ? examples
      : [...examples, { name: 'Generated example', payload: generatedPayload }]
  const entries = candidates.flatMap((value, index) => {
    const example = getResolvedRef(value)
    if (
      !example ||
      (example.headers === undefined && example.payload === undefined)
    ) {
      return []
    }
    return [
      {
        key: String(index),
        example,
        label: example.name || `${translate('schema.example')} ${index + 1}`,
      },
    ]
  })

  // Reserve every authored name before generating labels, including names later in the list.
  const labels = new Set(
    entries.flatMap(({ example }) => (example.name ? [example.name] : [])),
  )
  return entries.map((entry) => {
    const label =
      entry.example.name ||
      iterateTitle(entry.label, (value) => labels.has(value))
    labels.add(label)
    return { ...entry, label }
  })
})

const selectedKey = ref('')
watch(
  availableExamples,
  (values) => {
    if (!values.some(({ key }) => key === selectedKey.value)) {
      selectedKey.value = values[0]?.key ?? ''
    }
  },
  { immediate: true },
)

const selected = computed(() =>
  availableExamples.value.find(({ key }) => key === selectedKey.value),
)
/** Each section has its own format and accessible clipboard action. */
type MessageExampleBlock = NonNullable<
  ReturnType<typeof getMessageExampleContent>
> & {
  label: string
  copyLabel: string
}

const blocks = computed<MessageExampleBlock[]>(() => {
  const example = selected.value?.example
  if (!example) return []
  return [
    { label: 'Headers', value: getMessageExampleContent(example.headers) },
    {
      label: 'Payload',
      value: getMessageExampleContent(example.payload, contentType),
    },
  ].flatMap(({ label, value }) =>
    value
      ? [{ label, copyLabel: `Copy ${label.toLowerCase()}`, ...value }]
      : [],
  )
})
const pickerExamples = computed(() =>
  Object.fromEntries(
    availableExamples.value.map(({ key, label }) => [key, { summary: label }]),
  ),
)
const hasMultipleExamples = computed(() => availableExamples.value.length > 1)
const showFooter = computed(
  () =>
    hasMultipleExamples.value ||
    selected.value?.example.name ||
    selected.value?.example.summary,
)
</script>

<template>
  <ScalarCard
    v-if="blocks.length"
    class="min-w-0 self-start text-base"
    :label="translate('schema.examples')">
    <ScalarCardHeader>
      {{ translate('schema.examples') }}
    </ScalarCardHeader>
    <ScalarCardSection
      v-for="block in blocks"
      :key="block.label"
      class="flex-col">
      <div
        v-if="blocks.length > 1 || block.structural"
        class="text-c-2 px-3 py-2 text-sm">
        {{ block.label
        }}<span v-if="block.structural"> (structure only; not encoded)</span>
      </div>
      <ScalarVirtualCodeBlock
        v-if="block.content.length > 20_000"
        class="bg-b-2"
        :content="block.content"
        :label="block.label"
        :lang="block.lang" />
      <ScalarCodeBlock
        v-else
        class="bg-b-2"
        :copyLabel="block.copyLabel"
        :label="block.label"
        :lang="block.lang"
        :prettyPrintedContent="block.content" />
    </ScalarCardSection>
    <ScalarCardFooter
      v-if="showFooter"
      class="text-c-2 flex flex-col items-start gap-2 px-3 py-3">
      <ExamplePicker
        v-if="hasMultipleExamples"
        v-model="selectedKey"
        :aria-label="translate('schema.examples')"
        class="-ml-1.5"
        :examples="pickerExamples" />
      <span
        v-else-if="selected?.example.name"
        class="text-c-1 font-medium"
        >{{ selected.label }}</span
      >
      <ScalarMarkdown
        v-if="selected?.example.summary"
        class="min-w-0"
        :value="selected.example.summary" />
    </ScalarCardFooter>
  </ScalarCard>
</template>
