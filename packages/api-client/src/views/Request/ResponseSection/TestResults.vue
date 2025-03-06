<script setup lang="ts">
import { computed } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import type { TestResult } from '@/libs/execute-scripts'

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
  if (allTestsPassed.value) return 'passed'
  if (failedTests.value?.length) return 'failed'

  return 'pending'
})
</script>

<template>
  <ViewLayoutCollapse
    v-if="results?.length"
    class="overflow-auto"
    :defaultOpen="true">
    <template #title>Test Results</template>

    <template #actions>
      <!-- Show an indicator whether all tests passed -->
      <div class="mr-2">
        <div
          v-if="results?.length"
          class="h-2 w-2 rounded-full"
          :class="{
            'bg-green': currentState === 'passed',
            'bg-red': currentState === 'failed',
            'bg-grey': currentState === 'pending',
          }" />
      </div>
    </template>

    <!-- Results -->
    <div class="m-4 whitespace-nowrap text-xs">
      <div
        v-for="result in results"
        :key="result.title"
        class="flex items-center gap-2">
        <!-- Title -->
        <div class="flex items-center gap-2">
          <span
            :class="{
              'text-green': result.success,
              'text-red': !result.success && currentState !== 'pending',
              'text-c-1': currentState === 'pending',
            }">
            {{ result.success ? '✓' : currentState === 'pending' ? '⋯' : '✗' }}
          </span>
          <span class="text-c-1">
            {{ result.title }}
          </span>
        </div>
        <!-- Error -->
        <span
          v-if="result.error"
          class="truncate text-red-500">
          {{ result.error }}
        </span>
        <!-- Duration -->
        <span class="ml-auto"> {{ result.duration }} ms </span>
      </div>

      <!-- Summary -->
      <div class="mt-2 border-t pt-2">
        <div class="flex items-center gap-2">
          <span class="font-medium">Tests:</span>
          <span
            v-if="allTestsPassed"
            class="text-green">
            {{ passedTests?.length }} passed
          </span>
          <span
            v-else
            class="text-red">
            {{ failedTests?.length }} failed
          </span>
          <span
            v-if="pendingTests?.length"
            class="text-c-1">
            {{ pendingTests.length }} pending
          </span>
          <span class="text-c-3"> of {{ results?.length }} total </span>
          <span class="text-c-3 ml-auto">
            {{
              results?.reduce(
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
