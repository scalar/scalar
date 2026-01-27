<script setup lang="ts">
import {
  ScalarIconCheck,
  ScalarIconDotsThree,
  ScalarIconX,
} from '@scalar/icons'
import { computed, type Component } from 'vue'

import type { TestResult } from '@/libs/execute-scripts'

const { currentState, result } = defineProps<{
  result: TestResult
  currentState: TestResult['status']
}>()

const resultStatus = computed(() => {
  if (result.passed) {
    return {
      component: ScalarIconCheck as Component,
      color: 'text-green p-0.25',
    }
  }

  if (!result.passed && currentState !== 'pending') {
    return { component: ScalarIconX as Component, color: 'text-red' }
  }

  return { component: ScalarIconDotsThree as Component, color: 'text-c-1' }
})
</script>

<template>
  <div class="flex flex-col">
    <div
      class="flex h-8 items-center gap-2 pr-3 pl-2.25"
      :class="result.error && 'bg-b-danger'">
      <!-- Title -->
      <div class="flex items-center gap-3 p-2">
        <component
          :is="resultStatus.component"
          :class="resultStatus.color"
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
