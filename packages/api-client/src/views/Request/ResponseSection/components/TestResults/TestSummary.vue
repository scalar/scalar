<script setup lang="ts">
import type { TestResult } from '@/libs/execute-scripts'

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
  <div class="mt-2 border-t pt-2">
    <div class="flex items-center gap-2">
      <span class="font-medium">Tests:</span>
      <span
        v-if="allTestsPassed"
        class="text-green">
        {{ passedTests.length }} passed
      </span>
      <span
        v-else
        class="text-red">
        {{ failedTests.length }} failed
      </span>
      <span
        v-if="pendingTests.length"
        class="text-c-1">
        {{ pendingTests.length }} pending
      </span>
      <span class="text-c-3"> of {{ results.length }} total </span>
      <span class="text-c-3 ml-auto"> {{ totalDuration }} ms </span>
    </div>
  </div>
</template>
