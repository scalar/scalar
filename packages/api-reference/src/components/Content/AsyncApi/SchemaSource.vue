<script setup lang="ts">
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
  typeof value === 'string' ? 'plaintext' : 'json',
)
</script>

<template>
  <div class="min-w-0">
    <div class="text-c-2 font-code mb-2 text-sm break-all">{{ format }}</div>
    <ScalarVirtualCodeBlock
      v-if="content.length > 20_000"
      class="bg-b-2"
      :content="content"
      :lang="language" />
    <ScalarCodeBlock
      v-else
      class="bg-b-2"
      :lang="language"
      :prettyPrintedContent="content" />
  </div>
</template>
