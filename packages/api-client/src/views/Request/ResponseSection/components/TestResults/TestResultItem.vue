<script setup lang="ts">
import type { TestResult } from '@/libs/execute-scripts'

defineProps<{
  result: TestResult
  currentState: 'success' | 'failure' | 'pending'
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Title -->
    <div class="flex items-center gap-2">
      <span
        :class="{
          'text-green': result.success,
          'text-red': !result.success && currentState !== 'pending',
          'text-c-1': currentState === 'pending',
        }">
        {{
          currentState === 'success'
            ? '✓'
            : currentState === 'failure'
              ? '✗'
              : '⋯'
        }}
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
</template>
