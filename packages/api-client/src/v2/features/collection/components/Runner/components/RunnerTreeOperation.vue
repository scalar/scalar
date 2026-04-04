<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { computed } from 'vue'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

import RunnerTreeExample from './RunnerTreeExample.vue'

const props = defineProps<{
  path: string
  method: HttpMethod
  examples: { id: string; name: string }[]
  isDisabled?: boolean
  isSelected: (exampleName: string) => boolean
  getSelectionIndex: (exampleName: string) => number
  isFullySelected: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', exampleName: string): void
  (e: 'toggleAll'): void
}>()

const hasMultipleExamples = computed(() => props.examples.length > 1)
const hasSelection = computed(() =>
  props.examples.some((ex) => props.isSelected(ex.name)),
)
</script>

<template>
  <li
    class="bg-b-1 mb-3 rounded-lg border p-3 transition-colors duration-150 last:mb-0"
    :class="[
      hasSelection
        ? 'border-accent-color bg-accent-color/[0.03]'
        : 'border-border-color',
    ]">
    <div class="mb-2 flex items-start justify-between gap-2">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <HttpMethodBadge :method="props.method" />
        <span class="text-c-2 text-[0.8125rem] font-medium break-all">
          {{ props.path }}
        </span>
      </div>
      <button
        v-if="hasMultipleExamples && !props.isDisabled"
        class="hover:bg-b-3 text-accent-color shrink-0 cursor-pointer rounded border-none bg-transparent px-2 py-1 text-[0.6875rem] font-medium transition-colors duration-150"
        type="button"
        @click="emit('toggleAll')">
        {{ props.isFullySelected ? 'Deselect all' : 'Select all' }}
      </button>
    </div>
    <div class="flex flex-wrap gap-1.5">
      <RunnerTreeExample
        v-for="ex in props.examples"
        :key="ex.id"
        :isDisabled="props.isDisabled"
        :isSelected="props.isSelected(ex.name)"
        :name="ex.name"
        :orderIndex="props.getSelectionIndex(ex.name)"
        @toggle="emit('toggle', ex.name)" />
    </div>
  </li>
</template>
