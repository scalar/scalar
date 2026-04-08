<script setup lang="ts">
import { formatMilliseconds } from '@scalar/helpers/formatters/format-milliseconds'
import {
  ScalarIconCheckCircle,
  ScalarIconMinusCircle,
  ScalarIconTrash,
  ScalarIconXCircle,
} from '@scalar/icons'
import { cva } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

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

type SummaryStatus = 'passed' | 'failed' | 'skipped'

const summaryPillVariants = cva({
  base: 'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.6875rem] font-medium',
  variants: {
    status: {
      passed: 'text-green bg-green/10',
      failed: 'text-red bg-red/10',
      skipped: 'text-c-3 bg-b-3',
    },
  },
})

const summaryBannerVariants = cva({
  base: 'overflow-hidden rounded-xl border',
  variants: {
    outcome: {
      passed: 'border-green/30',
      failed: 'border-red/30',
    },
  },
})

const summaryHeaderVariants = cva({
  base: 'flex items-center gap-3 border-b px-4 py-3.5',
  variants: {
    outcome: {
      passed: 'bg-green/10 border-green/15',
      failed: 'bg-red/10 border-red/15',
    },
  },
})

const pills = computed<
  Array<{ status: SummaryStatus; count: number; label: string }>
>(() =>
  [
    { status: 'passed' as const, count: summary.passed, label: 'passed' },
    { status: 'failed' as const, count: summary.failed, label: 'failed' },
    { status: 'skipped' as const, count: summary.skipped, label: 'skipped' },
  ].filter((p) => p.status === 'passed' || p.count > 0),
)

const pillIcon = {
  passed: ScalarIconCheckCircle,
  failed: ScalarIconXCircle,
  skipped: ScalarIconMinusCircle,
} as const

const outcome = computed<'passed' | 'failed'>(() =>
  summary.allPassed ? 'passed' : 'failed',
)
</script>

<template>
  <div
    class="bg-b-2"
    :class="summaryBannerVariants({ outcome: outcome })">
    <div :class="summaryHeaderVariants({ outcome: outcome })">
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
        v-for="pill in pills"
        :key="pill.status"
        :class="summaryPillVariants({ status: pill.status })">
        <component
          :is="pillIcon[pill.status]"
          class="size-3.5" />
        {{ pill.count }} {{ pill.label }}
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
