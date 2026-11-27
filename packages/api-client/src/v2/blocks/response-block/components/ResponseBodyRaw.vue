<script lang="ts" setup>
import {
  ScalarCodeBlock,
  ScalarCodeBlockCopy,
} from '@scalar/components/code-block'
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarIconArrowElbowDownLeft } from '@scalar/icons'
import { computed, ref } from 'vue'

import { prettifyJsoncString } from '@/v2/blocks/response-block/helpers/prettify-jsonc-string'

const {
  content,
  language,
  prettyPrintJson = false,
} = defineProps<{
  content: unknown
  language?: string
  /** Format JSON Preview while preserving the source text in Raw. */
  prettyPrintJson?: boolean
}>()

const isLineWrapping = ref(false)

const displayContent = computed((): string => {
  const text = content == null ? '' : String(content)
  return prettyPrintJson && language === 'json'
    ? prettifyJsoncString(text)
    : text
})
</script>

<template>
  <div
    class="group/code-block relative grid min-h-0 min-w-0 overflow-hidden"
    data-testid="response-body-raw">
    <ScalarCodeBlock
      class="max-h-[75dvh] text-base"
      :copy="false"
      foldable
      label="Response body"
      :lang="language"
      lineNumbers
      :prettyPrintedContent="displayContent"
      virtualize
      :wrap="isLineWrapping" />
    <div
      v-if="displayContent"
      class="group-hocus-within/code-block:opacity-100 absolute top-2 right-2 flex items-center gap-1.5 opacity-0 transition-opacity duration-150">
      <ScalarIconButton
        aria-label="Wrap lines"
        :aria-pressed="isLineWrapping"
        class="bg-b-2 text-c-2 hover:text-c-1 absolute right-18"
        :icon="ScalarIconArrowElbowDownLeft"
        label="Wrap lines"
        size="sm"
        tooltip
        variant="ghost"
        @click="isLineWrapping = !isLineWrapping" />
      <ScalarCodeBlockCopy
        :content="displayContent"
        copyLabel="Copy response body" />
    </div>
  </div>
</template>
