<script setup lang="ts">
import { ScalarIconBook } from '@scalar/icons'
import { type OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  value?: OpenAPIV3_1.ExternalDocumentationObject
}>()
</script>

<template>
  <template v-if="value">
    <div
      class="group flex items-center last:border-r-0 xl:border-r xl:first:ml-auto">
      <a
        :href="value.url"
        class="text-c-1 hover:bg-b-2 mr-2 flex min-h-7 min-w-7 items-center rounded-lg border px-2 py-1 no-underline group-last:mr-0 xl:border-none"
        target="_blank"
        rel="noopener noreferrer">
        <ScalarIconBook
          weight="bold"
          class="size-3 text-current" />
        <span
          class="ml-1 empty:hidden"
          v-if="value.description">
          {{ value.description }}
        </span>
        <span
          class="ml-1 empty:hidden"
          v-else>
          {{ value.url }}
        </span>
      </a>
    </div>
  </template>
</template>
