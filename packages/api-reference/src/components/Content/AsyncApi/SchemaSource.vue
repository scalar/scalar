<script setup lang="ts">
import {
  ScalarCard,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components/card'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { ScalarVirtualCodeBlock } from '@scalar/components/virtual-code-block'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { isObject } from '@scalar/helpers/object/is-object'
import { computed } from 'vue'

const { value, format } = defineProps<{
  value: unknown
  format: string
}>()

/** Text schemas must retain their original whitespace, even when they resemble JSON. */
const content = computed<string>(() => {
  if (typeof value === 'string') {
    return value
  }
  return isObject(value) || Array.isArray(value)
    ? prettyPrintJson(value)
    : String(value)
})
const language = computed<string>(() =>
  typeof value !== 'string'
    ? 'json'
    : format.toLowerCase().startsWith('application/raml+yaml')
      ? 'yaml'
      : format.toLowerCase().startsWith('application/vnd.google.protobuf')
        ? 'protobuf'
        : 'plaintext',
)
</script>

<template>
  <ScalarCard
    class="min-w-0 text-base"
    label="Schema source">
    <ScalarCardHeader class="text-c-2 text-sm font-normal break-all">
      {{ format }}
    </ScalarCardHeader>
    <ScalarCardSection class="flex-col">
      <ScalarVirtualCodeBlock
        v-if="content.length > 20_000"
        class="bg-transparent"
        :content="content"
        label="Schema source"
        :lang="language" />
      <ScalarCodeBlock
        v-else
        class="bg-transparent"
        copyLabel="Copy schema source"
        label="Schema source"
        :lang="language"
        :prettyPrintedContent="content" />
    </ScalarCardSection>
  </ScalarCard>
</template>
