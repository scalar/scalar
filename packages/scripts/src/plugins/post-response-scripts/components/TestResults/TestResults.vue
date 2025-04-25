<script setup lang="ts">
import { computed, type Ref } from 'vue'

import type { TestResult } from '@/plugins/post-response-scripts/libs/execute-scripts'

import { ViewLayoutCollapse } from '../../../../components/ViewLayout'
import TestResultIndicator from './TestResultIndicator.vue'
import TestResultItem from './TestResultItem.vue'
import TestSummary from './TestSummary.vue'

const { results } = defineProps<{
  results?: Ref<TestResult[]> | undefined
}>()

const passedTests = computed(() =>
  results?.value?.filter((result: TestResult) => result.status === 'passed'),
)

const pendingTests = computed(() =>
  results?.value?.filter((result: TestResult) => result.status === 'pending'),
)

const failedTests = computed(() =>
  results?.value?.filter((result: TestResult) => result.status === 'failed'),
)

const allTestsPassed = computed(
  () => passedTests.value?.length === results?.value?.length,
)

const currentState = computed(() => {
  if (allTestsPassed.value) {
    return 'passed'
  }

  if (pendingTests.value?.length) {
    return 'pending'
  }

  return 'failed'
})

const totalDuration = computed(
  () =>
    results?.value?.reduce(
      (acc: number, curr: TestResult) => acc + curr.duration,
      0,
    ) ?? 0,
)
</script>

<template>
  <ViewLayoutCollapse
    v-if="results?.value?.length"
    class="overflow-auto text-sm"
    :defaultOpen="true">
    <template #title> Tests </template>
    <template #suffix>
      <TestResultIndicator
        :failedTestsCount="failedTests?.length"
        inline
        :passedTestsCount="passedTests?.length"
        :pendingTestsCount="pendingTests?.length"
        :state="currentState"
        :totalTestsCount="results?.value?.length" />
    </template>

    <div class="max-h-[calc(100%-32px)] divide-y overflow-y-auto border-t">
      <!-- Results -->
      <TestResultItem
        v-for="result in results?.value"
        :key="result.title"
        :currentState="result.status"
        :result="result" />

      <TestSummary
        v-if="results"
        :allTestsPassed="allTestsPassed"
        :failedTests="failedTests ?? []"
        :passedTests="passedTests ?? []"
        :pendingTests="pendingTests ?? []"
        :results="results?.value"
        :totalDuration="totalDuration" />
    </div>
  </ViewLayoutCollapse>
</template>
