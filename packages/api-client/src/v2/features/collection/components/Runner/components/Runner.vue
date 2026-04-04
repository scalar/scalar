<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import {
  ScalarIconArrowCounterClockwise,
  ScalarIconPlay,
} from '@scalar/icons'
import { computed } from 'vue'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import Section from '@/v2/features/settings/components/Section.vue'

import { useRunnerExecution, useRunnerSelection } from '../hooks'
import RunnerCard from './RunnerCard.vue'
import RunnerOrderItem from './RunnerOrderItem.vue'
import RunnerResults from './RunnerResults.vue'
import RunnerTree from './RunnerTree.vue'

const { document, collectionType, workspaceStore, documentSlug, layout } =
  defineProps<CollectionProps>()

const {
  selectedOrder,
  hasSelection,
  isSelected,
  toggle,
  clearAll,
  removeFromOrder,
  dragState,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
} = useRunnerSelection({
  isLocked: () => isLocked.value,
})

const {
  isRunning,
  hasRunCompleted,
  currentRunIndex,
  runLoader,
  runSummary,
  run,
  rerun,
  clearResults,
  getResultAtIndex,
  isResultPassed,
  isResultSkipped,
  getFailedTests,
} = useRunnerExecution({
  workspaceStore,
  document,
  documentName: documentSlug,
  isWeb: layout === 'web',
  selectedOrder: computed(() => selectedOrder.value),
})

const isLocked = computed(() => isRunning.value || hasRunCompleted.value)

const { draggedIndex, dragOverIndex, dragOffset } = dragState

const navigationChildren = computed(() => {
  return document?.['x-scalar-navigation']?.children ?? []
})

const hasOperations = computed(() => navigationChildren.value.length > 0)
</script>

<template>
  <Section v-if="collectionType === 'document'">
    <template #title>Runner</template>
    <template #description>
      Select operation examples, set the run order, then run them in sequence.
      Variables set by pre-request or post-response scripts are shared between
      runs.
    </template>

    <div class="flex flex-col gap-8 lg:flex-row lg:items-start">
      <!-- Left: Document operations tree -->
      <RunnerCard
        class="min-w-0 flex-1"
        subtitle="Check the examples you want to run. They will be added to the run order."
        title="Select operations">
        <div
          v-if="hasOperations"
          class="max-h-[28rem] overflow-y-auto"
          :class="{ 'opacity-60': isLocked }">
          <RunnerTree
            :disabled="isLocked"
            :entries="navigationChildren"
            :isSelected="isSelected"
            :selectedOrder="selectedOrder"
            @toggle="toggle" />
        </div>
        <div
          v-else
          class="py-6 text-center">
          <p class="text-c-3 text-sm">No operations in this document.</p>
          <p class="text-c-3 mt-1 text-xs">
            Add paths and methods to your API description to see them here.
          </p>
        </div>
      </RunnerCard>

      <!-- Right: Run order + actions + results -->
      <div class="flex w-full shrink-0 flex-col gap-4 lg:w-96">
        <!-- Run order card -->
        <RunnerCard title="Run order">
          <template #header>
            <button
              v-if="hasSelection && !isLocked"
              class="cursor-pointer border-none bg-transparent py-1 text-xs font-medium text-accent-color hover:underline"
              type="button"
              @click="clearAll">
              Clear all
            </button>
          </template>
          <template #subtitle>
            {{ selectedOrder.length }}
            {{ selectedOrder.length === 1 ? 'item' : 'items' }} selected.
            <template v-if="!isLocked">Drag to reorder.</template>
            <template v-else-if="hasRunCompleted">
              Clear results to modify.
            </template>
          </template>
          <template #default>
            <div
              v-if="selectedOrder.length > 0"
              class="flex flex-col gap-1.5"
              :class="{ 'opacity-60': isLocked }">
              <RunnerOrderItem
                v-for="(item, index) in selectedOrder"
                :key="item.id"
                :draggable="!isLocked"
                :exampleKey="item.exampleKey"
                :index="index"
                :isDragAfter="dragOverIndex === index && dragOffset === 'after'"
                :isDragBefore="dragOverIndex === index && dragOffset === 'before'"
                :isDragging="draggedIndex === index"
                :isLocked="isLocked"
                :method="item.method"
                :path="item.path"
                @dragend="handleDragEnd"
                @dragleave="handleDragLeave"
                @dragover="handleDragOver(index, $event)"
                @dragstart="handleDragStart(index, $event)"
                @drop="handleDrop"
                @remove="removeFromOrder(item)" />
            </div>
            <div
              v-else
              class="py-4 text-center">
              <p class="text-c-3 text-sm">No items yet.</p>
              <p class="text-c-3 mt-0.5 text-xs">
                Select operations from the list on the left.
              </p>
            </div>
          </template>
        </RunnerCard>

        <!-- Run button -->
        <div class="flex justify-end pt-1">
          <ScalarButton
            v-if="!hasRunCompleted"
            class="min-w-40"
            :disabled="!hasSelection || isRunning"
            :icon="ScalarIconPlay"
            :loader="runLoader"
            size="md"
            variant="gradient"
            @click="run">
            Run sequence
          </ScalarButton>
          <ScalarButton
            v-else
            class="min-w-40"
            :disabled="isRunning"
            :icon="ScalarIconArrowCounterClockwise"
            :loader="runLoader"
            size="md"
            variant="gradient"
            @click="rerun">
            Re-run sequence
          </ScalarButton>
        </div>

        <!-- Running progress -->
        <RunnerCard
          v-if="isRunning && currentRunIndex != null && selectedOrder.length > 0"
          compact>
          <p class="text-c-2 text-sm">
            Running step
            <span class="text-c-1 font-medium">
              {{ currentRunIndex }} / {{ selectedOrder.length }}
            </span>
          </p>
          <div
            :aria-valuemax="selectedOrder.length"
            :aria-valuemin="0"
            :aria-valuenow="currentRunIndex"
            class="bg-b-3 mt-2 h-1.5 overflow-hidden rounded-full"
            role="progressbar">
            <div
              class="h-full rounded-full bg-accent-color transition-[width] duration-200 ease-out"
              :style="{
                width: `${(currentRunIndex / selectedOrder.length) * 100}%`,
              }" />
          </div>
        </RunnerCard>

        <!-- Results -->
        <RunnerResults
          v-if="runSummary && hasRunCompleted"
          :getFailedTests="getFailedTests"
          :getResultAtIndex="getResultAtIndex"
          :isResultPassed="isResultPassed"
          :isResultSkipped="isResultSkipped"
          :selectedOrder="selectedOrder"
          :summary="runSummary"
          @clear="clearResults" />
      </div>
    </div>
  </Section>
</template>
