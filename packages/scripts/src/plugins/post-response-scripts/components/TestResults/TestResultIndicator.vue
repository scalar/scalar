<script setup lang="ts">
import { cva, ScalarIcon, useBindCx, type Icon } from '@scalar/components'
import { computed } from 'vue'

import type { TestResult } from '@/plugins/post-response-scripts/libs/execute-scripts'

const { state, totalTestsCount, pendingTestsCount, failedTestsCount } =
  defineProps<{
    state?: TestResult['status']
    failedTestsCount: number | undefined
    pendingTestsCount: number | undefined
    totalTestsCount: number | undefined
    inline?: boolean
  }>()

const { cx } = useBindCx()

const icon = computed(() => {
  if (state === 'passed') {
    return { name: 'Checkmark', color: 'text-green p-0.25' }
  }

  if (state === 'failed') {
    return { name: 'Close', color: 'text-red' }
  }

  return { name: 'Ellipses', color: 'text-c-1' }
})

const statusVariants = cva({
  base: 'flex items-center gap-1.5 rounded-full border pr-2 pl-1.25',
  variants: {
    status: {
      passed: 'text-green',
      failed: 'text-red',
      pending: 'text-orange',
    },
  },
})

const textVariants = cva({
  base: 'text-c-2',
  variants: {
    inline: {
      true: 'text-xs',
      false: 'text-sm',
    },
  },
})

// Display the number of tests that passed e.g 1/3
const getTestCountDisplay = computed(() => {
  // When there are no tests, show nothing
  if (totalTestsCount === undefined) {
    return ''
  }

  // When they failed, show failed/total
  if (failedTestsCount) {
    return `${failedTestsCount}/${totalTestsCount}`
  }

  // When they passed, show passed/total
  const completedTests =
    totalTestsCount - (pendingTestsCount || 0) - (failedTestsCount || 0)
  return `${completedTests}/${totalTestsCount}`
})
</script>

<template>
  <div v-bind="cx(statusVariants({ status: state }))">
    <ScalarIcon
      v-if="state"
      :class="icon.color"
      :icon="icon.name as Icon"
      size="sm" />
    <span
      v-if="!inline"
      class="ml-1.25 capitalize">
      {{ state }}
    </span>
    <span
      v-if="totalTestsCount !== undefined"
      v-bind="cx(textVariants({ inline }))">
      {{ getTestCountDisplay }}
    </span>
  </div>
</template>
