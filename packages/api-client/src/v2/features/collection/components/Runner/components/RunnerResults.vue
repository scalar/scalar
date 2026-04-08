<script setup lang="ts">
import { formatMilliseconds } from '@scalar/helpers/formatters/format-milliseconds'
import {
  ScalarIconCheckCircle,
  ScalarIconMinusCircle,
  ScalarIconTrash,
  ScalarIconXCircle,
} from '@scalar/icons'

import type { RunResult, RunSummary, SelectedItem, TestResult } from '../hooks'
import RunnerResultRow from './RunnerResultRow.vue'

const {
  summary,
  selectedOrder,
  getResultAtIndex,
  isResultPassed,
  isResultSkipped,
  getFailedTests,
} = defineProps<{
  summary: RunSummary
  selectedOrder: SelectedItem[]
  getResultAtIndex: (index: number) => RunResult | null
  isResultPassed: (result: RunResult | null) => boolean
  isResultSkipped: (index: number) => boolean
  getFailedTests: (result: RunResult | null) => TestResult[]
}>()

const emit = defineEmits<{
  (e: 'clear'): void
}>()
</script>

<template>
  <div
    class="bg-b-2 overflow-hidden rounded-xl border"
    :class="[summary.allPassed ? 'border-green/30' : 'border-red/30']">
    <div
      class="flex items-center gap-3 border-b px-4 py-3.5"
      :class="[
        summary.allPassed
          ? 'bg-green/10 border-green/15'
          : 'bg-red/10 border-red/15',
      ]">
      <div
        class="flex shrink-0 items-center justify-center"
        :class="summary.allPassed ? 'text-green' : 'text-red'">
        <ScalarIconCheckCircle
          v-if="summary.allPassed"
          class="size-5" />
        <ScalarIconXCircle
          v-else
          class="size-5" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="text-c-1 text-sm font-semibold">
          {{ summary.allPassed ? 'All tests passed' : 'Run failed' }}
        </span>
        <span class="text-c-3 text-xs">
          {{ summary.passed }}/{{ summary.total }} passed
          <template v-if="summary.duration">
            · {{ formatMilliseconds(summary.duration) }}
          </template>
        </span>
      </div>
      <button
        class="text-c-3 hover:text-c-1 hover:bg-b-3 flex cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-1.5 transition-colors duration-150"
        title="Clear results"
        type="button"
        @click="emit('clear')">
        <ScalarIconTrash class="size-4" />
      </button>
    </div>

    <div
      class="border-border-color bg-b-1 flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <span
        class="text-green bg-green/10 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.6875rem] font-medium">
        <ScalarIconCheckCircle class="size-3.5" />
        {{ summary.passed }} passed
      </span>
      <span
        v-if="summary.failed > 0"
        class="text-red bg-red/10 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.6875rem] font-medium">
        <ScalarIconXCircle class="size-3.5" />
        {{ summary.failed }} failed
      </span>
      <span
        v-if="summary.skipped > 0"
        class="text-c-3 bg-b-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.6875rem] font-medium">
        <ScalarIconMinusCircle class="size-3.5" />
        {{ summary.skipped }} skipped
      </span>
    </div>

    <ul
      aria-label="Run results"
      class="m-0 flex max-h-80 list-none flex-col gap-1 overflow-y-auto p-2">
      <RunnerResultRow
        v-for="(item, idx) in selectedOrder"
        :key="item.id"
        :exampleKey="item.exampleKey"
        :failedTests="getFailedTests(getResultAtIndex(idx))"
        :index="idx"
        :isPassed="isResultPassed(getResultAtIndex(idx))"
        :isSkipped="isResultSkipped(idx)"
        :method="item.method"
        :path="item.path"
        :result="getResultAtIndex(idx)" />
    </ul>
  </div>
</template>
