<script setup lang="ts">
import { computed } from 'vue'

import CopyMarkdownButton from '@/components/CopyMarkdownButton.vue'
import type { OperationProps } from '@/features/Operation/Operation.vue'

const { document, path, method, isWebhook } =
  defineProps<
    Pick<OperationProps, 'document' | 'path' | 'method' | 'isWebhook'>
  >()

/** Capture the selection so pending copies cannot show success on a different page. */
const getMarkdown = computed(() => {
  const source = document
  const selection = isWebhook
    ? { webhook: { name: path, method } }
    : { operation: { path, method } }
  return async (): Promise<string> => {
    const { createMarkdownFromOpenApi } =
      await import('@scalar/openapi-to-markdown/browser')
    return createMarkdownFromOpenApi(source, selection)
  }
})
</script>

<template>
  <CopyMarkdownButton :getMarkdown />
</template>
