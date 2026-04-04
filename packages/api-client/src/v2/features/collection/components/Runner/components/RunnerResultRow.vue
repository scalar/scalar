<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import {
  ScalarIconCheckCircle,
  ScalarIconMinusCircle,
  ScalarIconXCircle,
} from '@scalar/icons'

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

const statusClasses = {
  passed: 'bg-green/5 hover:bg-green/10',
  failed: 'bg-red/5 hover:bg-red/10',
  skipped: 'opacity-60',
  default: '',
}

const indicatorClasses = {
  passed: 'text-green bg-green/15',
  failed: 'text-red bg-red/15',
  skipped: 'text-c-3 bg-b-3',
}
</script>

<template>
  <li
    class="border-border-color bg-b-1 hover:border-c-3 flex items-start gap-2.5 rounded-lg border p-2.5 text-[0.8125rem] transition-all duration-150"
    :class="[
      isPassed && statusClasses.passed,
      result && !isPassed && statusClasses.failed,
      isSkipped && statusClasses.skipped,
    ]">
    <div
      class="mt-px flex size-6 shrink-0 items-center justify-center rounded-full"
      :class="[
        isPassed && indicatorClasses.passed,
        result && !isPassed && indicatorClasses.failed,
        isSkipped && indicatorClasses.skipped,
      ]">
      <ScalarIconCheckCircle
        v-if="isPassed"
        class="size-4" />
      <ScalarIconXCircle
        v-else-if="result"
        class="size-4" />
      <ScalarIconMinusCircle
        v-else-if="isSkipped"
        class="size-4" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="flex flex-wrap items-center gap-1.5">
        <span
          class="bg-b-3 text-c-3 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold">
          {{ index + 1 }}
        </span>
        <HttpMethodBadge :method="method" />
        <span class="text-c-2 font-medium break-all">{{ path }}</span>
        <span class="bg-b-3 text-c-3 rounded px-1.5 py-0.5 text-[0.6875rem]">
          {{ exampleKey }}
        </span>
      </div>

      <div
        v-if="result?.result"
        class="flex items-center gap-2 text-xs">
        <span
          class="rounded px-1.5 py-0.5 font-semibold"
          :class="[
            result.result.status >= 200 && result.result.status < 300
              ? 'text-green bg-green/10'
              : result.result.status >= 400
                ? 'text-red bg-red/10'
                : '',
          ]">
          {{ result.result.status }}
        </span>
        <span class="text-c-3">
          {{ Math.round(result.result.duration) }}ms
        </span>
      </div>
      <div
        v-else-if="isSkipped"
        class="flex items-center gap-2 text-xs">
        <span class="text-c-3">Skipped</span>
      </div>

      <p
        v-if="result?.error"
        class="text-red bg-red/10 m-0 rounded px-2 py-1.5 text-xs leading-relaxed">
        {{ result.error.message }}
      </p>

      <div
        v-if="failedTests.length > 0"
        class="bg-red/10 border-red/15 flex flex-col gap-1.5 rounded-md border px-2.5 py-2">
        <p
          v-for="(test, testIdx) in failedTests"
          :key="testIdx"
          class="m-0 text-xs leading-relaxed">
          <span class="text-red font-medium">{{ test.title }}</span>
          <span
            v-if="test.error"
            class="text-c-2 mt-0.5 block text-[0.6875rem]">
            {{ test.error }}
          </span>
        </p>
      </div>
    </div>
  </li>
</template>
