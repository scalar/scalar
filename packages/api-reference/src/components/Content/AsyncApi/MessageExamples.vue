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
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
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
      : [
          ...examples,
          {
            name: translate('schema.example'),
            summary: undefined,
            payload: generatedPayload,
          },
        ]
  const entries = candidates.flatMap((value, index) => {
    const example = getResolvedAsyncApiRef(value)
    if (!example || example.payload === undefined) {
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
const block = computed(() =>
  getMessageExampleContent(selected.value?.example.payload, contentType),
)
const pickerExamples = computed(() =>
  Object.fromEntries(
    availableExamples.value.map(({ key, label }) => [key, { summary: label }]),
  ),
)
const hasMultipleExamples = computed(() => availableExamples.value.length > 1)
</script>

<template>
  <ScalarCard
    v-if="block || $slots.heading"
    class="min-w-0 self-start text-base"
    :label="translate('schema.examples')">
    <ScalarCardHeader
      v-if="
        $slots.heading ||
        hasMultipleExamples ||
        selected?.example.name ||
        selected?.example.summary
      "
      class="text-c-2 px-3 py-[7px] font-normal [&_.scalar-card-header-title]:whitespace-normal">
      <slot name="heading" />
      <div
        v-if="
          !$slots.heading &&
          (selected?.example.name || selected?.example.summary)
        "
        class="min-w-0 grow">
        <div
          v-if="selected.example.name"
          class="text-c-1 font-medium">
          {{ selected.label }}
        </div>
        <ScalarMarkdown
          v-if="selected.example.summary"
          class="mt-1 text-base [&_*]:m-0"
          :value="selected.example.summary" />
      </div>
      <template
        v-if="hasMultipleExamples && !$slots.heading"
        #actions>
        <ExamplePicker
          v-model="selectedKey"
          :aria-label="translate('schema.examples')"
          class="-m-1 shrink-0 px-0"
          :examples="pickerExamples" />
      </template>
    </ScalarCardHeader>
    <ScalarCardSection
      v-if="block"
      class="flex-col">
      <div
        v-if="block.structural"
        class="text-c-2 px-3 py-2 text-sm">
        Structure only; not encoded
      </div>
      <ScalarVirtualCodeBlock
        v-if="block.content.length > 20_000"
        class="bg-b-2"
        :content="block.content"
        label="Payload"
        :lang="block.lang" />
      <ScalarCodeBlock
        v-else
        class="bg-b-2"
        copyLabel="Copy payload"
        label="Payload"
        :lang="block.lang"
        :prettyPrintedContent="block.content" />
    </ScalarCardSection>
    <ScalarCardSection
      v-else
      class="text-c-2 p-3 text-sm">
      No payload example available.
    </ScalarCardSection>
    <ScalarCardFooter
      v-if="
        $slots.heading && (hasMultipleExamples || selected?.example.summary)
      "
      class="flex shrink-0 flex-row-reverse flex-wrap justify-start gap-x-2 px-3 py-[7px]">
      <ExamplePicker
        v-if="hasMultipleExamples"
        v-model="selectedKey"
        :aria-label="translate('schema.examples')"
        class="-m-1 shrink-0 px-0"
        :examples="pickerExamples" />
      <ScalarMarkdown
        v-if="selected?.example.summary"
        class="text-c-1 grow text-sm font-semibold [&_*]:m-0"
        :value="selected.example.summary" />
    </ScalarCardFooter>
  </ScalarCard>
</template>
