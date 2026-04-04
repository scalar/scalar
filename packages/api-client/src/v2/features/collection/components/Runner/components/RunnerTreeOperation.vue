<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
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
const selectedCount = computed(
  () => props.examples.filter((ex) => props.isSelected(ex.name)).length,
)
</script>

<template>
  <li
    class="bg-b-1 mb-2 rounded-lg border p-2.5 transition-colors duration-100 last:mb-0"
    :class="hasSelection ? 'border-accent-color/40' : 'border-border-color'">
    <!-- Header row: method + path + actions -->
    <div class="flex items-center gap-2">
      <HttpMethodBadge
        class="text-[0.625rem] font-semibold"
        :method="props.method"
        short />
      <span
        class="text-c-2 min-w-0 flex-1 truncate text-xs"
        :title="props.path">
        {{ props.path }}
      </span>

      <!-- Selection count -->
      <span
        v-if="hasSelection && hasMultipleExamples"
        class="text-c-3 text-[0.65rem] tabular-nums">
        {{ selectedCount }}/{{ props.examples.length }}
      </span>

      <!-- Select all button -->
      <ScalarButton
        class="transition-opacity duration-100"
        :class="
          hasMultipleExamples && !props.isDisabled
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        "
        size="xs"
        variant="ghost"
        @click="emit('toggleAll')">
        <span class="hover:underline">{{
          props.isFullySelected ? 'Clear' : 'All'
        }}</span>
      </ScalarButton>
    </div>

    <!-- Examples list -->
    <div class="border-border-color mt-2 flex flex-col gap-0.5 border-t pt-2">
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
