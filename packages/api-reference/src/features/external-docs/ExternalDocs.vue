<script setup lang="ts">
import { sanitizeUrl } from '@scalar/helpers/url/is-safe-url'
import { ScalarIconBook } from '@scalar/icons'
import type { ExternalDocumentationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

const { value } = defineProps<{
  value?: ExternalDocumentationObject
}>()

/**
 * The external docs URL comes from the OpenAPI document, which is untrusted input, so a protocol
 * like `javascript:` would execute script on click. Fall back to the plain text label in that case.
 */
const url = computed(() => sanitizeUrl(value?.url))
</script>

<template>
  <template v-if="value">
    <div
      class="group narrow:border-r-0 narrow:first:ml-0 flex items-center border-r first:ml-auto last:border-r-0">
      <component
        :is="url ? 'a' : 'span'"
        class="text-c-1 hover:bg-b-2 narrow:border mr-2 flex min-h-7 min-w-7 items-center rounded-lg px-2 py-1 no-underline group-last:mr-0"
        :href="url"
        :rel="url ? 'noopener noreferrer' : undefined"
        :target="url ? '_blank' : undefined">
        <ScalarIconBook
          class="size-3 text-current"
          weight="bold" />
        <span
          v-if="value.description"
          class="ml-1 empty:hidden">
          {{ value.description }}
        </span>
        <span
          v-else
          class="ml-1 empty:hidden">
          {{ value.url }}
        </span>
      </component>
    </div>
  </template>
</template>
