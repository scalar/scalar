<script setup lang="ts">
import type { TestResult } from '@/plugins/post-response-scripts/libs/execute-scripts'

import TestResultIndicator from './TestResultIndicator.vue'

defineProps<{
  results: TestResult[]
  passedTests: TestResult[]
  failedTests: TestResult[]
  pendingTests: TestResult[]
  allTestsPassed: boolean
  totalDuration: number
}>()
</script>

<template>
  <div class="flex h-8 items-center gap-1.5 pl-1 pr-3">
    <TestResultIndicator
      :failedTestsCount="failedTests?.length"
      :passedTestsCount="passedTests?.length"
      :pendingTestsCount="pendingTests?.length"
      :state="allTestsPassed ? 'passed' : 'failed'"
      :totalTestsCount="results?.length" />
    <span
      v-if="pendingTests?.length"
      class="text-orange">
      {{ pendingTests?.length }}
      Pending
    </span>
    <span class="text-c-3 ml-auto"> {{ totalDuration.toFixed(1) }} ms </span>
  </div>
</template>
