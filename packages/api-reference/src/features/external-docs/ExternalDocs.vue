<script setup lang="ts">
import { ScalarIconBook } from '@scalar/icons'
import type { ExternalDocumentationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

defineProps<{
  value?: ExternalDocumentationObject
}>()
</script>

<template>
  <template v-if="value">
    <div
      class="group narrow:border-r-0 narrow:first:ml-0 flex items-center border-r first:ml-auto last:border-r-0">
      <a
        class="text-c-1 hover:bg-b-2 narrow:border mr-2 flex min-h-7 min-w-7 items-center rounded-lg px-2 py-1 no-underline group-last:mr-0"
        :href="value.url"
        rel="noopener noreferrer"
        target="_blank">
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
      </a>
    </div>
  </template>
</template>
