<script setup lang="ts">
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { computed } from 'vue'

import CopyMarkdownButton from '@/components/CopyMarkdownButton.vue'

const { document, selection } = defineProps<{
  document: AsyncApiDocument
  /** Map keys identify pages independently of their display titles or addresses. */
  selection:
    | { channel: string }
    | { operation: string }
    | { tag: string }
    | { introduction: true }
}>()

const getMarkdown = computed(() => {
  const source = document
  const page = selection
  return async (): Promise<string> => {
    const { createMarkdownFromAsyncApi } =
      await import('@scalar/asyncapi-to-markdown/browser')
    return createMarkdownFromAsyncApi(source, page)
  }
})
</script>

<template>
  <CopyMarkdownButton :getMarkdown />
</template>
