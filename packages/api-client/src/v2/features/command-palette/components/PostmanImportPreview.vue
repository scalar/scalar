<script lang="ts">
/**
 * Full Postman collection import preview: metadata, request picker, merge target, and convert options.
 */
export default {
  name: 'PostmanImportPreview',
}
</script>

<script setup lang="ts">
import { ScalarCheckboxInput, ScalarTooltip } from '@scalar/components'

// import type { PostmanImportPreviewState } from '@/v2/features/command-palette/helpers/use-postman-import-preview'

// import PostmanCollectionRequestPicker from './PostmanCollectionRequestPicker.vue'

const { title, version, schema } = defineProps<{
  title: string
  version: string
  schema?: string
  totalRequests: number
  availableTargetDocuments: { slug: string; label: string }[]
  hasCollisionPathKeys: boolean
}>()

const slots = defineSlots<{
  treePicker: () => unknown
}>()

const selectedTargetDocument = defineModel<{
  slug: string
  label: string
} | null>('selectedTargetDocument')
const mergeSamePathAndMethod = defineModel<boolean>('mergeSamePathAndMethod')
</script>

<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-hidden">
    <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-hidden">
      <div
        class="border-border bg-b-2 text-c-2 shrink-0 rounded border px-2.5 py-1.5 text-[11px] leading-tight">
        <div class="text-c-1 truncate font-medium">
          {{ title }}
        </div>
        <div
          class="text-c-3 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <template v-if="schema">
            <span class="whitespace-nowrap">
              {{ schema }}
            </span>
            <span
              aria-hidden="true"
              class="text-c-3 opacity-50">
              ·
            </span>
          </template>
          <span class="whitespace-nowrap"> v{{ version }} </span>
          <span
            aria-hidden="true"
            class="text-c-3 opacity-50">
            ·
          </span>
          <span class="whitespace-nowrap">
            {{ totalRequests }}
            {{ totalRequests === 1 ? 'request' : 'requests' }}
          </span>
        </div>
      </div>
      <div
        v-if="hasCollisionPathKeys"
        class="postman-import-path-conflict-callout shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] leading-snug break-words">
        <span class="font-semibold text-[var(--scalar-color-red)]">
          Conflict
        </span>
        <template v-if="selectedTargetDocument">
          — Same OpenAPI path + method as existing operations in
          <span class="font-medium">
            {{ selectedTargetDocument.label }}
          </span>
          .
          <template v-if="!mergeSamePathAndMethod">
            These will overwrite existing operations unless
            <span class="font-medium">Merge same path &amp; method</span>
            is enabled.
          </template>
          <template v-else>
            These will be merged with existing operations.
          </template>
        </template>
        <template v-else>
          — Same OpenAPI path + method for multiple selected requests. Turn on
          <span class="font-medium">Merge same path &amp; method</span>
          to combine them; otherwise the last one wins.
        </template>
      </div>
    </div>
    <div class="max-h-[300px] overflow-y-auto">
      <slots.treePicker />
    </div>

    <section
      class="border-border bg-b-2 flex shrink-0 flex-col gap-2 rounded-md border px-2.5 py-2">
      <div
        v-if="availableTargetDocuments.length > 0"
        class="flex min-w-0 flex-col gap-1">
        <label
          class="text-c-2 text-[10px] font-medium tracking-wide uppercase"
          for="postman-import-target">
          Import into
        </label>
        <select
          id="postman-import-target"
          v-model="selectedTargetDocument"
          class="border-border bg-b-1 text-c-1 focus:ring-c-accent w-full min-w-0 rounded border px-2 py-1.5 text-[11px] outline-none focus:ring-1">
          <option :value="null">New document</option>
          <option
            v-for="row in availableTargetDocuments"
            :key="row.slug"
            :value="row">
            {{ row.label }}
          </option>
        </select>
      </div>
      <ScalarTooltip
        content="When several Postman requests map to the same OpenAPI path and HTTP method, merge them into one operation instead of keeping duplicate operations."
        placement="top">
        <div
          class="[&>label]:bg-transparent [&>label]:p-0 [&>label]:shadow-none [&>label]:hover:bg-transparent">
          <ScalarCheckboxInput v-model="mergeSamePathAndMethod">
            <span class="text-c-1 text-[11px] leading-snug font-medium">
              Merge same path &amp; method
            </span>
          </ScalarCheckboxInput>
        </div>
      </ScalarTooltip>
    </section>
  </div>
</template>

<style scoped>
.postman-import-path-conflict-callout {
  border-color: var(--scalar-color-red);
  background-color: var(--scalar-background-danger);
  color: var(--scalar-color-1);
}
</style>
