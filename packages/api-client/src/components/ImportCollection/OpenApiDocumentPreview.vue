<script lang="ts" setup>
import { REQUEST_METHODS } from '@scalar/oas-utils/helpers'
import type { OpenAPI } from '@scalar/openapi-types'
import { computed } from 'vue'

import OperationBadge from './OperationBadge.vue'

const props = defineProps<{
  content?: OpenAPI.Document
}>()

/** Get all operations from the OpenAPI document */
const operations = computed(() => {
  return Object.entries(props.content?.paths || {})
    .flatMap(([path, item]: [string, OpenAPI.Document['paths']]) =>
      Object.entries(item || {}).map(
        ([method, operation]: [string, OpenAPI.Operation]) => ({
          method: method.toLowerCase() as keyof typeof REQUEST_METHODS,
          name: operation.summary || operation.operationId || path,
        }),
      ),
    )
    .filter((operation) =>
      Object.keys(REQUEST_METHODS).includes(operation.method),
    )
})

/** Random order */
function shuffle(items: any[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

/** Make the array have at least the given number of items */
function fill(items: any[], count: number) {
  const result = [...items]

  // Less than `count`? Let’s copy a few items
  while (result.length && result.length < count) {
    const remaining = count - result.length
    const itemsToCopy = items.slice(0, Math.min(remaining, items.length))
    result.push(...itemsToCopy)
  }

  return result
}
</script>

<template>
  <div
    v-if="content && operations.length"
    class="flex flex-col gap-2 overflow-hidden">
    <template
      v-for="(direction, row) in [
        'animate-scroll-left',
        'animate-scroll-right',
        'animate-scroll-left',
      ]"
      :key="row">
      <div :class="`flex gap-2 ${direction}`">
        <template
          v-for="({ method, name }, operation) in shuffle(fill(operations, 10))"
          :key="`row-${row}-${operation}`">
          <OperationBadge
            :method="method"
            :name="name" />
        </template>
      </div>
    </template>
  </div>
</template>

<style>
@keyframes scroll-left-right {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-50%);
  }
}

@keyframes scroll-right-left {
  0%,
  100% {
    transform: translateX(-50%);
  }
  50% {
    transform: translateX(0);
  }
}

.animate-scroll-left {
  animation: scroll-left-right 60s linear infinite;
}

.animate-scroll-right {
  animation: scroll-right-left 60s linear infinite;
}
</style>
