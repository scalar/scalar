<script setup lang="ts">
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import ScriptEditor from '@/components/ScriptEditor.vue'
import { ViewLayoutCollapse } from '@/components/ViewLayout'
import ExampleScripts from '@/plugins/request-scripts/components/PostResponseScripts/ExampleScripts.vue'

const { document } = defineProps<{
  document?: OpenApiDocument | null
}>()

const emit = defineEmits<{
  (e: 'update:extension', payload: Record<string, unknown>): void
}>()

const preRequestScript = computed(
  () => (document?.['x-pre-request'] as string) ?? '',
)
const postResponseScript = computed(
  () => (document?.['x-post-response'] as string) ?? '',
)

const hasAnyScript = computed(
  () =>
    preRequestScript.value.length > 0 || postResponseScript.value.length > 0,
)

const updatePreRequestScript = (value: string) => {
  emit('update:extension', { 'x-pre-request': value })
}
const updatePostResponseScript = (value: string) => {
  emit('update:extension', { 'x-post-response': value })
}
</script>

<template>
  <div class="w-full">
    <ViewLayoutCollapse
      class="w-full"
      :defaultOpen="true">
      <template #title>Scripts</template>
      <template #suffix>
        <!-- Show an indicator whether we have a script -->
        <div class="mr-2">
          <div
            v-if="hasAnyScript"
            class="bg-green h-2 w-2 rounded-full" />
        </div>
      </template>

      <!-- Pre-request -->
      <div class="text-c-3 flex h-8 items-center border-y px-3 text-sm">
        Pre-request — run before each request in this document (e.g. set
        variables, headers).
      </div>
      <ScriptEditor
        :modelValue="preRequestScript"
        @update:modelValue="updatePreRequestScript" />

      <!-- Post-response -->
      <div class="text-c-3 flex h-8 items-center border-y px-3 text-sm">
        Post-response — run after each response in this document (e.g. tests,
        assertions).
      </div>
      <ScriptEditor
        :modelValue="postResponseScript"
        @update:modelValue="updatePostResponseScript" />
      <div class="border-y p-3">
        <ExampleScripts
          :modelValue="postResponseScript"
          @update:modelValue="updatePostResponseScript" />
      </div>
    </ViewLayoutCollapse>
  </div>
</template>
