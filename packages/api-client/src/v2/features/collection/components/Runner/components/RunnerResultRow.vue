<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { ScalarIconCheck, ScalarIconMinus, ScalarIconX } from '@scalar/icons'
import { computed } from 'vue'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

import type { RunResult, TestResult } from '../hooks'

const {
  index,
  method,
  path,
  exampleKey,
  result,
  isPassed,
  isSkipped,
  failedTests,
} = defineProps<{
  index: number
  method: HttpMethod
  path: string
  exampleKey: string
  result: RunResult | null
  isPassed: boolean
  isSkipped: boolean
  failedTests: TestResult[]
}>()

const status = computed(() => {
  if (isSkipped) {
    return 'skipped'
  }
  if (isPassed) {
    return 'passed'
  }
  if (result) {
    return 'failed'
  }
  return 'pending'
})

const statusConfig = {
  passed: {
    bg: 'bg-green/8',
    border: 'border-green/20',
    icon: 'bg-green text-white',
  },
  failed: {
    bg: 'bg-red/8',
    border: 'border-red/20',
    icon: 'bg-red text-white',
  },
  skipped: {
    bg: 'bg-b-2',
    border: 'border-border-color',
    icon: 'bg-b-3 text-c-3',
  },
  pending: {
    bg: 'bg-b-1',
    border: 'border-border-color',
    icon: 'bg-b-3 text-c-3',
  },
}

const hasBody = computed(() => result?.error || failedTests.length > 0)
</script>

<template>
  <li
    class="group flex gap-3 rounded-lg border p-3 transition-colors duration-100"
    :class="[
      statusConfig[status].bg,
      statusConfig[status].border,
      hasBody ? 'items-start' : 'items-center',
    ]">
    <!-- Status icon -->
    <div
      class="flex size-5 shrink-0 items-center justify-center rounded-full"
      :class="statusConfig[status].icon">
      <ScalarIconCheck
        v-if="status === 'passed'"
        class="size-3" />
      <ScalarIconX
        v-else-if="status === 'failed'"
        class="size-3" />
      <ScalarIconMinus
        v-else
        class="size-3" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <!-- Main row -->
      <div class="flex items-center justify-between gap-3">
        <!-- Left: method + path -->
        <div class="flex min-w-0 flex-1 items-center gap-1.5">
          <span class="text-c-3 shrink-0 text-[0.65rem] tabular-nums">
            #{{ index + 1 }}
          </span>
          <HttpMethodBadge
            class="shrink-0 text-[0.6rem] font-bold uppercase"
            :method="method"
            short />
          <span
            class="text-c-1 min-w-0 truncate text-[0.75rem] font-medium"
            :title="path">
            {{ path }}
          </span>
          <span
            class="bg-b-3 text-c-3 shrink-0 rounded px-1.5 py-0.5 text-[0.6rem]">
            {{ exampleKey }}
          </span>
        </div>

        <!-- Right: status code + duration -->
        <div
          v-if="result?.result"
          class="flex shrink-0 items-center gap-1.5">
          <span
            class="rounded px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums"
            :class="[
              result.result.status >= 200 && result.result.status < 300
                ? 'bg-green/15 text-green'
                : result.result.status >= 400
                  ? 'bg-red/15 text-red'
                  : 'bg-b-3 text-c-2',
            ]">
            {{ result.result.status }}
          </span>
          <span class="text-c-3 text-[0.65rem] tabular-nums">
            {{ Math.round(result.result.duration) }}ms
          </span>
        </div>
        <span
          v-else-if="isSkipped"
          class="text-c-3 text-[0.65rem] italic">
          skipped
        </span>
      </div>

      <!-- Error message -->
      <div
        v-if="result?.error"
        class="bg-red/10 text-red rounded px-2.5 py-2 text-[0.7rem] leading-relaxed">
        {{ result.error.message }}
      </div>

      <!-- Failed tests -->
      <div
        v-if="failedTests.length > 0"
        class="bg-red/10 flex flex-col gap-1 rounded px-2.5 py-2">
        <div
          v-for="(test, testIdx) in failedTests"
          :key="testIdx"
          class="flex flex-col gap-0.5">
          <span class="text-red text-[0.7rem] font-medium">
            {{ test.title }}
          </span>
          <span
            v-if="test.error"
            class="text-c-2 text-[0.65rem]">
            {{ test.error }}
          </span>
        </div>
      </div>
    </div>
  </li>
</template>
