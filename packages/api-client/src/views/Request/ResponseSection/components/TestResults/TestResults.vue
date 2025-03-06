<script setup lang="ts">
import { computed } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import type { TestResult } from '@/libs/execute-scripts'

import TestResultIndicator from './TestResultIndicator.vue'
import TestResultItem from './TestResultItem.vue'
import TestSummary from './TestSummary.vue'

const { results } = defineProps<{
  results?: TestResult[] | undefined
}>()

const passedTests = computed(() =>
  results?.filter((result: TestResult) => result.success),
)

const pendingTests = computed(() =>
  results?.filter((result: TestResult) => result.status === 'pending'),
)

const failedTests = computed(() =>
  results?.filter((result: TestResult) => result.status === 'failure'),
)

const allTestsPassed = computed(
  () => passedTests.value?.length === results?.length,
)

const currentState = computed(() => {
  if (allTestsPassed.value) return 'success'
  if (pendingTests.value?.length) return 'pending'
  return 'failure'
})

const totalDuration = computed(
  () =>
    results?.reduce(
      (acc: number, curr: TestResult) => acc + curr.duration,
      0,
    ) ?? 0,
)
</script>

<template>
  <ViewLayoutCollapse
    v-if="results?.length"
    class="overflow-auto"
    :defaultOpen="true">
    <template #title>Test Results</template>

    <template #actions>
      <TestResultIndicator :state="currentState" />
    </template>

    <!-- Results -->
    <div class="m-4 whitespace-nowrap text-xs">
      <TestResultItem
        v-for="result in results"
        :key="result.title"
        :currentState="result.status"
        :result="result" />

      <TestSummary
        v-if="results"
        :allTestsPassed="allTestsPassed"
        :failedTests="failedTests ?? []"
        :passedTests="passedTests ?? []"
        :pendingTests="pendingTests ?? []"
        :results="results"
        :totalDuration="totalDuration" />
    </div>
  </ViewLayoutCollapse>
</template>
