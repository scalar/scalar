<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { ScalarIconDotsSixVertical, ScalarIconX } from '@scalar/icons'

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
  remove: []
}>()
</script>

<template>
  <div
    class="group relative flex h-8 items-center rounded-md after:pointer-events-none after:absolute after:inset-x-0 after:block after:rounded after:bg-blue after:opacity-0"
    :class="[
      isLocked ? 'cursor-default bg-b-2' : 'cursor-grab bg-b-1',
      isDragging && 'opacity-40',
      isDragBefore && 'after:-top-0.5 after:h-1 after:opacity-100',
      isDragAfter && 'after:-bottom-0.5 after:h-1 after:opacity-100',
    ]">
    <!-- Drag handle -->
    <div
      v-if="!isLocked"
      class="flex h-full shrink-0 cursor-grab items-center px-1 text-c-3 opacity-40 transition-opacity duration-100 group-hover:opacity-100"
      title="Drag to reorder">
      <ScalarIconDotsSixVertical class="size-3" />
    </div>

    <!-- Index -->
    <span
      class="shrink-0 text-[0.65rem] tabular-nums text-c-3"
      :class="isLocked ? 'pl-2 pr-1.5' : 'pr-1.5'">
      #{{ index + 1 }}
    </span>

    <!-- Method + Path -->
    <div class="flex min-w-0 flex-1 items-center gap-1.5 pr-2">
      <HttpMethodBadge
        class="shrink-0 text-[0.6rem] font-bold uppercase"
        :method="method"
        short />
      <span
        class="min-w-0 flex-1 truncate text-[0.7rem] text-c-2"
        :title="path">
        {{ path }}
      </span>
    </div>

    <!-- Example key pill -->
    <span
      v-if="exampleKey !== 'default'"
      class="mr-1 shrink-0 rounded bg-b-3 px-1.5 py-0.5 text-[0.6rem] text-c-3">
      {{ exampleKey }}
    </span>

    <!-- Remove button -->
    <button
      v-if="!isLocked"
      aria-label="Remove from run order"
      class="mr-1 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-c-3 opacity-0 transition-all duration-100 hover:bg-red/10 hover:text-red group-hover:opacity-100"
      type="button"
      @click.stop="emit('remove')">
      <ScalarIconX class="size-3" />
    </button>
  </div>
</template>
