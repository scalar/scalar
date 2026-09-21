<script setup lang="ts">
import { ExamplePicker } from '@scalar/blocks/code-example'
import {
  ScalarCard,
  ScalarCardFooter,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components/card'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { ScalarCopy } from '@scalar/components/copy'
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarVirtualCodeBlock } from '@scalar/components/virtual-code-block'
import { iterateTitle } from '@scalar/helpers/string/iterate-title'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed, ref, watch } from 'vue'

import { useLocalization } from '@/features/localization'

import { getMessageExampleContent } from './helpers/get-message-example-content'

const { examples = [], generatedPayload } = defineProps<{
  examples?: AsyncApiMessageObject['examples']
  generatedPayload?: unknown
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
const content = computed(() =>
  selected.value ? getMessageExampleContent(selected.value.example) : undefined,
)
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
    v-if="content !== undefined"
    class="min-w-0 self-start text-base"
    :label="translate('schema.examples')">
    <ScalarCardHeader>
      {{ translate('schema.examples') }}
      <template #actions>
        <ScalarCopy
          :aria-label="translate('common.copyExample')"
          :content="content"
          placement="left">
          <template #copy>{{ translate('common.copyExample') }}</template>
        </ScalarCopy>
      </template>
    </ScalarCardHeader>
    <ScalarCardSection>
      <ScalarVirtualCodeBlock
        v-if="content.length > 20_000"
        class="bg-b-2"
        :content="content"
        lang="json" />
      <ScalarCodeBlock
        v-else
        class="bg-b-2"
        lang="json"
        :prettyPrintedContent="content" />
    </ScalarCardSection>
    <ScalarCardFooter
      v-if="showFooter"
      class="text-c-2 flex flex-wrap items-center gap-2">
      <ExamplePicker
        v-if="hasMultipleExamples"
        v-model="selectedKey"
        :aria-label="translate('schema.examples')"
        :examples="pickerExamples" />
      <span v-else-if="selected?.example.name">{{ selected.label }}</span>
      <ScalarMarkdown
        v-if="selected?.example.summary"
        class="min-w-0"
        :value="selected.example.summary" />
    </ScalarCardFooter>
  </ScalarCard>
</template>
