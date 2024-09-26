<script lang="ts" setup>
import { REQUEST_METHODS } from '@scalar/oas-utils/helpers'
import type { OpenAPI } from '@scalar/openapi-types'
import { computed } from 'vue'

import OperationBadge from './OperationBadge.vue'

const props = defineProps<{
  content: OpenAPI.Document
}>()

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
</script>

<template>
  <div class="flex flex-col gap-2 overflow-hidden">
    <template
      v-for="(direction, row) in [
        'animate-scroll-left',
        'animate-scroll-right',
        'animate-scroll-left',
      ]"
      :key="row">
      <div :class="`flex gap-2 ${direction}`">
        <template
          v-for="({ method, name }, operation) in [...operations].sort(
            () => Math.random() - 0.5,
          )"
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
@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

@keyframes scroll-right {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

.animate-scroll-left {
  animation: scroll-left 120s linear infinite;
}

.animate-scroll-right {
  animation: scroll-right 120s linear infinite;
}
</style>
