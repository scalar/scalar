<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { ScalarIconDotsSixVertical, ScalarIconTrash } from '@scalar/icons'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

const {
  index,
  method,
  path,
  exampleKey,
  isLocked = false,
  isDragging = false,
  isDragBefore = false,
  isDragAfter = false,
} = defineProps<{
  index: number
  method: HttpMethod
  path: string
  exampleKey: string
  isLocked?: boolean
  isDragging?: boolean
  isDragBefore?: boolean
  isDragAfter?: boolean
}>()

const emit = defineEmits<{
  (e: 'remove'): void
}>()
</script>

<template>
  <div
    class="border-border-color bg-b-1 relative flex items-center gap-1.5 rounded-lg border py-2 pr-2 transition-all duration-150"
    :class="[
      isLocked ? 'cursor-default pl-2' : 'hover:bg-b-3 cursor-grab pl-1',
      isDragging && 'border-dashed opacity-50',
      isDragBefore &&
        'before:bg-accent-color before:absolute before:-top-1 before:right-0 before:left-0 before:h-1 before:rounded-sm',
      isDragAfter &&
        'after:bg-accent-color after:absolute after:right-0 after:-bottom-1 after:left-0 after:h-1 after:rounded-sm',
    ]">
    <div
      v-if="!isLocked"
      class="text-c-3 hover:text-c-1 flex shrink-0 cursor-grab items-center justify-center rounded p-1 transition-colors duration-150"
      title="Drag to reorder">
      <ScalarIconDotsSixVertical class="size-4" />
    </div>
    <span
      aria-hidden="true"
      class="text-c-3 w-5 shrink-0 text-center text-xs font-medium">
      {{ index + 1 }}
    </span>
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <HttpMethodBadge :method="method" />
      <span
        class="text-c-2 min-w-0 flex-1 truncate text-[0.8125rem]"
        :title="path">
        {{ path }}
      </span>
      <span
        class="bg-b-3 text-c-3 shrink-0 rounded px-1.5 py-0.5 text-[0.6875rem]">
        {{ exampleKey }}
      </span>
    </div>
    <button
      v-if="!isLocked"
      aria-label="Remove from run order"
      class="text-c-3 hover:text-red hover:bg-b-3 inline-flex size-7 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 transition-colors duration-150"
      type="button"
      @click="emit('remove')">
      <ScalarIconTrash class="size-4" />
    </button>
  </div>
</template>
