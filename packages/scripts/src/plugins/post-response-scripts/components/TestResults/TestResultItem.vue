<script setup lang="ts">
import { ScalarIcon, type Icon } from '@scalar/components'
import { computed } from 'vue'

import type { TestResult } from '@/libs/execute-scripts'

const { currentState, result } = defineProps<{
  result: TestResult
  currentState: TestResult['status']
}>()

const resultStatus = computed(() => {
  if (result.passed) {
    return { icon: 'Checkmark', color: 'text-green p-0.25' }
  }

  if (!result.passed && currentState !== 'pending') {
    return { icon: 'Close', color: 'text-red' }
  }

  return { icon: 'Ellipses', color: 'text-c-1' }
})
</script>

<template>
  <div class="flex flex-col">
    <div
      class="flex h-8 items-center gap-2 pr-3 pl-2.25"
      :class="result.error && 'bg-b-danger'">
      <!-- Title -->
      <div class="flex items-center gap-3 p-2">
        <ScalarIcon
          :class="resultStatus.color"
          :icon="resultStatus.icon as Icon"
          size="sm" />

        <span class="text-c-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {{ result.title }}
        </span>
      </div>
      <!-- Duration -->
      <span class="text-c-3 ml-auto whitespace-nowrap">
        {{ result.duration }} ms
      </span>
    </div>
    <!-- Error -->
    <div
      v-if="result.error"
      class="bg-b-danger text-c-1 flex items-center pr-3 pb-1.5 pl-9">
      {{ result.error }}
    </div>
  </div>
</template>
