<script setup lang="ts">
import { sanitizeUrl } from '@scalar/helpers/url/is-safe-url'
import { ScalarIconBook } from '@scalar/icons'
import {
  getResolvedRef,
  type NodeInput,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ExternalDocumentationObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

const { value } = defineProps<{
  value?: NodeInput<ExternalDocumentationObject>
}>()

const documentation = computed<ExternalDocumentationObject | undefined>(() => {
  const resolved = getResolvedRef(value)
  return resolved && typeof resolved.url === 'string' && resolved.url
    ? resolved
    : undefined
})
/** Unsafe URL protocols fall back to a plain-text label. */
const url = computed<string | undefined>(() =>
  sanitizeUrl(documentation.value?.url),
)
</script>

<template>
  <template v-if="documentation">
    <div
      class="group narrow:border-r-0 narrow:first:ml-0 flex items-center border-r first:ml-auto last:border-r-0">
      <component
        :is="url ? 'a' : 'span'"
        :aria-label="documentation.description || documentation.url"
        class="text-c-1 hover:bg-b-2 narrow:border mr-2 flex min-h-7 min-w-7 items-center rounded-lg px-2 py-1 no-underline group-last:mr-0"
        :href="url"
        :rel="url ? 'noopener noreferrer' : undefined"
        :target="url ? '_blank' : undefined">
        <ScalarIconBook
          class="size-3 text-current"
          weight="bold" />
        <span
          v-if="documentation.description"
          class="ml-1 empty:hidden">
          {{ documentation.description }}
        </span>
        <span
          v-else
          class="ml-1 empty:hidden">
          {{ documentation.url }}
        </span>
      </component>
    </div>
  </template>
</template>
