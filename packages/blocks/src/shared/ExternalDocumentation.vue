<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { sanitizeUrl } from '@scalar/helpers/url/is-safe-url'
import { ScalarIconBook } from '@scalar/icons'
import {
  getResolvedRef,
  type NodeInput,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ExternalDocumentationObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

const { value } = defineProps<{
  /** Inline or resolved documentation from the API description. */
  value?: NodeInput<ExternalDocumentationObject>
}>()

const documentation = computed<ExternalDocumentationObject | undefined>(() => {
  const resolved = getResolvedRef(value)
  return resolved && typeof resolved.url === 'string' && resolved.url
    ? resolved
    : undefined
})
const url = computed<string | undefined>(() =>
  sanitizeUrl(documentation.value?.url),
)
</script>

<template>
  <div
    v-if="documentation"
    class="grid min-w-0 gap-1 text-sm">
    <component
      :is="url ? 'a' : 'span'"
      class="text-c-1 inline-flex w-fit max-w-full items-start gap-1 break-all"
      :href="url"
      :rel="url ? 'noopener noreferrer' : undefined"
      :target="url ? '_blank' : undefined">
      <ScalarIconBook
        class="mt-1 size-3 shrink-0"
        weight="bold" />
      <span>{{ documentation.url }}</span>
    </component>
    <!-- Descriptions can contain links, so render Markdown outside the documentation anchor. -->
    <ScalarMarkdown
      v-if="documentation.description"
      :value="documentation.description" />
  </div>
</template>
