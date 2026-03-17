<script setup lang="ts">
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { computed, type Ref } from 'vue'

import ScriptEditor from '@/components/ScriptEditor.vue'
import { ViewLayoutCollapse } from '@/components/ViewLayout'
import type { TestResult } from '@/libs/execute-scripts'
import ExampleScripts from '@/plugins/post-response-scripts/components/PostResponseScripts/ExampleScripts.vue'
import TestResultIndicator from '@/plugins/post-response-scripts/components/TestResults/TestResultIndicator.vue'

const { operation, results } = defineProps<{
  operation?: Pick<OperationObject, 'x-pre-request' | 'x-post-response'>
  results?: Ref<TestResult[]>
}>()

const emit = defineEmits<{
  (e: 'operation:update:extension', payload: any): void
}>()

const preRequestScript = computed(
  () => (operation?.['x-pre-request'] as string) ?? '',
)
const postResponseScript = computed(
  () => (operation?.['x-post-response'] as string) ?? '',
)

const hasAnyScript = computed(
  () =>
    preRequestScript.value.length > 0 || postResponseScript.value.length > 0,
)

const updatePreRequestScript = (value: string) => {
  emit('operation:update:extension', { 'x-pre-request': value })
}
const updatePostResponseScript = (value: string) => {
  emit('operation:update:extension', { 'x-post-response': value })
}

const passedTests = computed(
  () => results?.value?.filter((r) => r.status === 'passed') ?? [],
)
const pendingTests = computed(
  () => results?.value?.filter((r) => r.status === 'pending') ?? [],
)
const failedTests = computed(
  () => results?.value?.filter((r) => r.status === 'failed') ?? [],
)
const allTestsPassed = computed(
  () =>
    (results?.value?.length ?? 0) > 0 &&
    passedTests.value.length === results?.value?.length,
)
const currentState = computed(() => {
  if (allTestsPassed.value) {
    return 'passed'
  }
  if (pendingTests.value.length) {
    return 'pending'
  }
  return 'failed'
})
const hasResults = computed(() => (results?.value?.length ?? 0) > 0)
</script>

<template>
  <div class="w-full">
    <ViewLayoutCollapse
      class="w-full"
      :defaultOpen="true">
      <template #title>Scripts</template>
      <template #suffix>
        <div class="mr-2 flex items-center gap-2">
          <div
            v-if="hasAnyScript"
            class="bg-green h-2 w-2 rounded-full" />
          <TestResultIndicator
            v-if="hasResults"
            :failedTestsCount="failedTests.length"
            inline
            :passedTestsCount="passedTests.length"
            :pendingTestsCount="pendingTests.length"
            :state="currentState"
            :totalTestsCount="results?.value?.length" />
        </div>
      </template>

      <!-- Pre-request -->
      <div class="text-c-3 flex h-8 items-center border-y px-3 text-sm">
        Pre-request — run before the request is sent (e.g. set variables,
        headers).
      </div>
      <ScriptEditor
        :modelValue="preRequestScript"
        @update:modelValue="updatePreRequestScript" />

      <!-- Post-response -->
      <div class="text-c-3 flex h-8 items-center border-y px-3 text-sm">
        Post-response — run after the response is received (e.g. tests,
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
