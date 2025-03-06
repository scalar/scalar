<script setup lang="ts">
import { computed, ref } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import type { TestResult } from '@/libs/execute-scripts'

// defineProps<{
//   results?: TestResult[]
// }>()

const results = ref<TestResult[]>([
  {
    title: 'Status Code is 200',
    success: true,
    error: null,
    duration: 0.1,
    status: 'success',
  },
  {
    title: 'Status Code is 404',
    success: false,
    error: 'Unexpected token ) in JSON at position 1',
    duration: 0.3,
    status: 'failure',
  },
])

const passedTests = computed(() =>
  results.value.filter((result: TestResult) => result.success),
)

const allPassed = computed(
  () => passedTests.value.length === results.value.length,
)
</script>

<template>
  <ViewLayoutCollapse
    v-if="results.length > 0"
    class="overflow-auto"
    :defaultOpen="true">
    <template #title>Test Results</template>
    <template #actions>
      <!-- Show an indicator whether we have a script -->
      <div class="mr-2">
        <div
          v-if="results.length > 0"
          class="h-2 w-2 rounded-full"
          :class="{
            'bg-green': allPassed,
            'bg-red': !allPassed,
          }" />
      </div>
    </template>

    <div class="m-4 whitespace-nowrap text-xs">
      <div
        v-for="result in results"
        :key="result.title"
        class="flex items-center gap-2">
        <div class="flex items-center gap-2">
          <span :class="result.success ? 'text-green' : 'text-red'">
            {{ result.success ? '✓' : '✗' }}
          </span>
          <span class="text-c-1">
            {{ result.title }}
          </span>
        </div>
        <!-- error, truncated to 50 characters -->
        <span
          v-if="result.error"
          class="truncate text-red-500">
          {{ result.error }}
        </span>
        <!-- duration right-aligned -->
        <span class="ml-auto"> {{ result.duration }} ms </span>
      </div>

      <!-- Test Summary -->
      <div class="mt-2 border-t pt-2">
        <div class="flex items-center gap-2">
          <span class="font-medium">Tests:</span>
          <span :class="allPassed ? 'text-green' : 'text-red'">
            {{ passedTests.length }} passed
          </span>
          <span class="text-c-3"> of {{ results.length }} total </span>
          <span class="text-c-3 ml-auto">
            {{
              results.reduce(
                (acc: number, curr: TestResult) => acc + curr.duration,
                0,
              )
            }}
            ms
          </span>
        </div>
      </div>
    </div>
  </ViewLayoutCollapse>
</template>
