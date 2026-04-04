<script setup lang="ts">
import { ScalarButton, useLoadingState } from '@scalar/components'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import {
  ScalarIconArrowCounterClockwise,
  ScalarIconCheckCircle,
  ScalarIconDotsSixVertical,
  ScalarIconMinusCircle,
  ScalarIconPlay,
  ScalarIconTrash,
  ScalarIconXCircle,
} from '@scalar/icons'
import {
  executePostResponseScript,
  executePreRequestScript,
} from '@scalar/pre-post-request-scripts'
import {
  buildRequest,
  createVariablesStoreForRequest,
  getEnvironmentVariables,
  getRequestExampleContext,
  requestFactory,
} from '@scalar/workspace-store/request-example'
import { computed, ref } from 'vue'

import { isElectron } from '@/libs/electron'
import {
  sendRequest,
  type ResponseInstance,
} from '@/v2/blocks/operation-block/helpers/send-request'
import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'
import { APP_VERSION } from '@/v2/constants'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import Section from '@/v2/features/settings/components/Section.vue'

import RunnerTree from './RunnerTree.vue'

const props = defineProps<CollectionProps>()

/** One selectable row: operation example (path + method + exampleKey) with stable id */
type SelectedItem = {
  id: string
  path: string
  method: HttpMethod
  exampleKey: string
  label: string
}

type TestResult = {
  title: string
  passed: boolean
  duration: number
  error?: string
  status: 'pending' | 'passed' | 'failed'
}

/** Result of running a single item */
type RunResult = {
  item: SelectedItem
  result: ResponseInstance | null
  error: Error | null
  testResults: TestResult[]
}

const selectedOrder = ref<SelectedItem[]>([])
const isRunning = ref(false)
const currentRunIndex = ref<number | null>(null)
const runLoader = useLoadingState()
const runResults = ref<RunResult[]>([])
const runStartTime = ref<number | null>(null)
const runEndTime = ref<number | null>(null)

const runSummary = computed(() => {
  if (runResults.value.length === 0 && !hasRunCompleted.value) {
    return null
  }
  const ran = runResults.value.length
  const total = selectedOrder.value.length
  const passed = runResults.value.filter(
    (r) => !r.error && r.testResults.every((t) => t.passed),
  ).length
  const failed = ran - passed
  const skipped = total - ran
  const duration =
    runStartTime.value && runEndTime.value
      ? runEndTime.value - runStartTime.value
      : null
  const allPassed = failed === 0 && skipped === 0
  return { total, passed, failed, skipped, duration, allPassed }
})

const hasRunCompleted = ref(false)

const isLocked = computed(() => isRunning.value || hasRunCompleted.value)

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

function clearResults(): void {
  runResults.value = []
  hasRunCompleted.value = false
  runStartTime.value = null
  runEndTime.value = null
}

function rerun(): void {
  clearResults()
  void run()
}

function getResultAtIndex(index: number): RunResult | null {
  return runResults.value[index] ?? null
}

function isResultPassed(result: RunResult | null): boolean {
  if (!result) {
    return false
  }
  if (result.error) {
    return false
  }
  if (result.testResults.some((t) => !t.passed)) {
    return false
  }
  return true
}

function isResultSkipped(index: number): boolean {
  return hasRunCompleted.value && getResultAtIndex(index) === null
}

function getFailedTests(result: RunResult | null): TestResult[] {
  if (!result) {
    return []
  }
  return result.testResults.filter((t) => !t.passed)
}

const navigationChildren = computed(() => {
  if (props.collectionType !== 'document' || !props.document) {
    return []
  }
  const nav = props.document['x-scalar-navigation']
  return nav?.children ?? []
})

const hasOperations = computed(() => navigationChildren.value.length > 0)

/** Check if this (path, method, exampleKey) is in the selected list */
function isSelected(
  path: string,
  method: HttpMethod,
  exampleKey: string,
): boolean {
  return selectedOrder.value.some(
    (s) =>
      s.path === path && s.method === method && s.exampleKey === exampleKey,
  )
}

/** Toggle selection of an operation example */
function toggle(
  path: string,
  method: HttpMethod,
  exampleKey: string,
  label: string,
): void {
  if (isLocked.value) {
    return
  }
  const id = `${path}|${method}|${exampleKey}`
  const idx = selectedOrder.value.findIndex((s) => s.id === id)
  if (idx >= 0) {
    selectedOrder.value = selectedOrder.value.filter((_, i) => i !== idx)
  } else {
    selectedOrder.value = [
      ...selectedOrder.value,
      { id, path, method, exampleKey, label },
    ]
  }
}

function clearAll(): void {
  if (isLocked.value) {
    return
  }
  selectedOrder.value = []
}

function removeFromOrder(item: SelectedItem): void {
  if (isLocked.value) {
    return
  }
  selectedOrder.value = selectedOrder.value.filter((s) => s.id !== item.id)
}

const hasSelection = computed(() => selectedOrder.value.length > 0)

const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const dragOffset = ref<'before' | 'after' | null>(null)

function handleDragStart(index: number, event: DragEvent): void {
  if (isLocked.value) {
    event.preventDefault()
    return
  }
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function handleDragOver(index: number, event: DragEvent): void {
  event.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === index) {
    dragOverIndex.value = null
    dragOffset.value = null
    return
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const midpoint = rect.top + rect.height / 2
  const offset = event.clientY < midpoint ? 'before' : 'after'

  dragOverIndex.value = index
  dragOffset.value = offset
}

function handleDragLeave(): void {
  dragOverIndex.value = null
  dragOffset.value = null
}

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  if (
    draggedIndex.value === null ||
    dragOverIndex.value === null ||
    dragOffset.value === null
  ) {
    return
  }

  const fromIndex = draggedIndex.value
  const toIndex = dragOverIndex.value

  if (fromIndex === toIndex) {
    resetDragState()
    return
  }

  const list = [...selectedOrder.value]
  const [removed] = list.splice(fromIndex, 1)
  if (!removed) {
    resetDragState()
    return
  }

  let insertIndex = toIndex
  if (fromIndex < toIndex) {
    insertIndex = dragOffset.value === 'after' ? toIndex : toIndex - 1
  } else {
    insertIndex = dragOffset.value === 'before' ? toIndex : toIndex + 1
  }

  insertIndex = Math.max(0, Math.min(insertIndex, list.length))
  list.splice(insertIndex, 0, removed)
  selectedOrder.value = list

  resetDragState()
}

function handleDragEnd(): void {
  resetDragState()
}

function resetDragState(): void {
  draggedIndex.value = null
  dragOverIndex.value = null
  dragOffset.value = null
}

/** Run all selected items in sequence */
async function run(): Promise<void> {
  if (props.collectionType !== 'document' || !props.document) {
    return
  }

  isRunning.value = true
  hasRunCompleted.value = false
  runLoader.start()
  runResults.value = []
  currentRunIndex.value = 0
  runStartTime.value = Date.now()
  runEndTime.value = null

  const variablesStore = createVariablesStoreForRequest()

  for (let i = 0; i < selectedOrder.value.length; i++) {
    currentRunIndex.value = i + 1
    const item = selectedOrder.value[i]!

    const runResult: RunResult = {
      item,
      result: null,
      error: null,
      testResults: [],
    }

    try {
      const contextResult = getRequestExampleContext(
        props.workspaceStore,
        props.documentSlug,
        { path: item.path, method: item.method, exampleName: item.exampleKey },
        {
          fallbackDocument: props.document,
          isElectron: isElectron(),
          layout: props.layout === 'web' ? 'web' : 'other',
          appVersion: APP_VERSION,
        },
      )

      if (!contextResult.ok) {
        runResult.error = new Error(contextResult.error)
        runResults.value = [...runResults.value, runResult]
        continue
      }

      const ctx = contextResult.data
      const globalCookies = [...ctx.cookies.workspace, ...ctx.cookies.document]

      const { request: requestBuilder } = requestFactory({
        defaultHeaders: ctx.headers.default,
        environment: ctx.environment.environment,
        exampleName: item.exampleKey,
        globalCookies,
        method: item.method,
        operation: ctx.operation,
        path: item.path,
        proxyUrl: ctx.proxy.url ?? '',
        server: ctx.servers.selected,
        selectedSecuritySchemes: ctx.security.selectedSchemes,
        isElectron: isElectron(),
      })

      const preRequestScript =
        `${props.document['x-pre-request'] ?? ''}\n${ctx.operation['x-pre-request'] ?? ''}`.trim()
      await executePreRequestScript(preRequestScript, {
        requestBuilder,
        variablesStore,
        onTestResultsUpdate: (newResults) => {
          runResult.testResults = [...newResults]
        },
      })

      const envVariables = {
        ...getEnvironmentVariables(ctx.environment.environment),
        ...variablesStore.getVariables(),
      }

      const requestResult = (() => {
        try {
          return {
            ok: true,
            result: buildRequest(requestBuilder, { envVariables }),
          } as const
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          return { ok: false, error: message } as const
        }
      })()

      if (!requestResult.ok) {
        runResult.error = new Error(requestResult.error)
        runResults.value = [...runResults.value, runResult]
        continue
      }

      const [sendError, sendResult] = await sendRequest({
        isUsingProxy: requestResult.result.isUsingProxy,
        request: requestResult.result.request,
      })

      if (sendError) {
        runResult.error = sendError
        runResults.value = [...runResults.value, runResult]
        continue
      }

      runResult.result = sendResult.response

      const postResponseScript =
        `${props.document['x-post-response'] ?? ''};\n${ctx.operation['x-post-response'] ?? ''}`.trim()
      await executePostResponseScript(postResponseScript, {
        requestBuilder,
        response: sendResult.originalResponse.clone(),
        variablesStore,
        onTestResultsUpdate: (newResults) => {
          runResult.testResults = [...runResult.testResults, ...newResults]
        },
      })

      runResults.value = [...runResults.value, runResult]

      const hasTestFailure = runResult.testResults.some((t) => !t.passed)
      if (hasTestFailure) {
        break
      }
    } catch (error) {
      runResult.error =
        error instanceof Error ? error : new Error(String(error))
      runResults.value = [...runResults.value, runResult]
      break
    }
  }

  isRunning.value = false
  hasRunCompleted.value = true
  runEndTime.value = Date.now()
  void runLoader.clear()
  currentRunIndex.value = null
}
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
      <div class="runner-card min-w-0 flex-1">
        <h3 class="runner-card__title">Select operations</h3>
        <p class="text-c-2 runner-card__subtitle">
          Check the examples you want to run. They will be added to the run
          order.
        </p>
        <div
          v-if="hasOperations"
          class="runner-tree-wrapper"
          :class="{ 'runner-tree-wrapper--locked': isLocked }">
          <RunnerTree
            :disabled="isLocked"
            :entries="navigationChildren"
            :isSelected="isSelected"
            :selectedOrder="selectedOrder"
            @toggle="toggle" />
        </div>
        <div
          v-else
          class="runner-empty">
          <p class="text-c-3 text-sm">No operations in this document.</p>
          <p class="text-c-3 mt-1 text-xs">
            Add paths and methods to your API description to see them here.
          </p>
        </div>
      </div>

      <!-- Right: Run order + actions + results -->
      <div class="flex w-full shrink-0 flex-col gap-4 lg:w-96">
        <!-- Run order card -->
        <div class="runner-card">
          <div class="runner-card__header-row">
            <h3 class="runner-card__title">Run order</h3>
            <button
              v-if="hasSelection && !isLocked"
              class="runner-link"
              type="button"
              @click="clearAll">
              Clear all
            </button>
          </div>
          <p class="text-c-2 runner-card__subtitle">
            {{ selectedOrder.length }}
            {{ selectedOrder.length === 1 ? 'item' : 'items' }} selected.
            <template v-if="!isLocked">Drag to reorder.</template>
            <template v-else-if="hasRunCompleted">
              Clear results to modify.
            </template>
          </p>

          <div
            v-if="selectedOrder.length > 0"
            class="runner-order-list"
            :class="{ 'runner-order-list--locked': isLocked }">
            <div
              v-for="(item, index) in selectedOrder"
              :key="item.id"
              class="runner-order-item"
              :class="{
                'runner-order-item--dragging': draggedIndex === index,
                'runner-order-item--drag-before':
                  dragOverIndex === index && dragOffset === 'before',
                'runner-order-item--drag-after':
                  dragOverIndex === index && dragOffset === 'after',
                'runner-order-item--locked': isLocked,
              }"
              :draggable="!isLocked"
              @dragend="handleDragEnd"
              @dragleave="handleDragLeave"
              @dragover="handleDragOver(index, $event)"
              @dragstart="handleDragStart(index, $event)"
              @drop="handleDrop">
              <div
                v-if="!isLocked"
                class="runner-order-item__drag-handle"
                title="Drag to reorder">
                <ScalarIconDotsSixVertical class="size-4" />
              </div>
              <span
                aria-hidden="true"
                class="runner-order-item__index">
                {{ index + 1 }}
              </span>
              <div class="runner-order-item__main">
                <HttpMethodBadge :method="item.method" />
                <span
                  class="runner-order-item__path"
                  :title="item.path">
                  {{ item.path }}
                </span>
                <span class="runner-order-item__example">{{
                  item.exampleKey
                }}</span>
              </div>
              <button
                v-if="!isLocked"
                :aria-label="`Remove from run order`"
                class="runner-icon-btn runner-icon-btn--danger"
                type="button"
                @click="removeFromOrder(item)">
                <ScalarIconTrash class="size-4" />
              </button>
            </div>
          </div>
          <div
            v-else
            class="runner-empty runner-empty--compact">
            <p class="text-c-3 text-sm">No items yet.</p>
            <p class="text-c-3 mt-0.5 text-xs">
              Select operations from the list on the left.
            </p>
          </div>
        </div>

        <!-- Run button -->
        <div class="runner-actions">
          <ScalarButton
            v-if="!hasRunCompleted"
            class="runner-run-btn"
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
            class="runner-run-btn"
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
        <div
          v-if="
            isRunning && currentRunIndex != null && selectedOrder.length > 0
          "
          class="runner-card runner-progress">
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
            class="runner-progress__bar"
            role="progressbar">
            <div
              class="runner-progress__fill"
              :style="{
                width: `${(currentRunIndex / selectedOrder.length) * 100}%`,
              }" />
          </div>
        </div>

        <!-- Results -->
        <div
          v-if="runSummary && hasRunCompleted"
          class="runner-results"
          :class="{
            'runner-results--success': runSummary.allPassed,
            'runner-results--failure': !runSummary.allPassed,
          }">
          <!-- Status banner -->
          <div class="runner-results__banner">
            <div class="runner-results__banner-icon">
              <ScalarIconCheckCircle
                v-if="runSummary.allPassed"
                class="size-5" />
              <ScalarIconXCircle
                v-else
                class="size-5" />
            </div>
            <div class="runner-results__banner-content">
              <span class="runner-results__banner-title">
                {{ runSummary.allPassed ? 'All tests passed' : 'Run failed' }}
              </span>
              <span class="runner-results__banner-meta">
                {{ runSummary.passed }}/{{ runSummary.total }} passed
                <template v-if="runSummary.duration">
                  · {{ formatDuration(runSummary.duration) }}
                </template>
              </span>
            </div>
            <button
              class="runner-results__clear"
              title="Clear results"
              type="button"
              @click="clearResults">
              <ScalarIconTrash class="size-4" />
            </button>
          </div>

          <!-- Stats pills -->
          <div class="runner-results__stats">
            <span class="runner-results__stat runner-results__stat--pass">
              <ScalarIconCheckCircle class="size-3.5" />
              {{ runSummary.passed }} passed
            </span>
            <span
              v-if="runSummary.failed > 0"
              class="runner-results__stat runner-results__stat--fail">
              <ScalarIconXCircle class="size-3.5" />
              {{ runSummary.failed }} failed
            </span>
            <span
              v-if="runSummary.skipped > 0"
              class="runner-results__stat runner-results__stat--skip">
              <ScalarIconMinusCircle class="size-3.5" />
              {{ runSummary.skipped }} skipped
            </span>
          </div>

          <!-- Results list -->
          <ul
            aria-label="Run results"
            class="runner-results__list">
            <li
              v-for="(item, idx) in selectedOrder"
              :key="item.id"
              class="runner-result-row"
              :class="{
                'runner-result-row--passed': isResultPassed(
                  getResultAtIndex(idx),
                ),
                'runner-result-row--failed':
                  getResultAtIndex(idx) &&
                  !isResultPassed(getResultAtIndex(idx)),
                'runner-result-row--skipped': isResultSkipped(idx),
              }">
              <div class="runner-result-row__indicator">
                <ScalarIconCheckCircle
                  v-if="isResultPassed(getResultAtIndex(idx))"
                  class="size-4" />
                <ScalarIconXCircle
                  v-else-if="getResultAtIndex(idx)"
                  class="size-4" />
                <ScalarIconMinusCircle
                  v-else-if="isResultSkipped(idx)"
                  class="size-4" />
              </div>
              <div class="runner-result-row__content">
                <div class="runner-result-row__header">
                  <span class="runner-result-row__index">{{ idx + 1 }}</span>
                  <HttpMethodBadge :method="item.method" />
                  <span class="runner-result-row__path">{{ item.path }}</span>
                  <span class="runner-result-row__example">{{
                    item.exampleKey
                  }}</span>
                </div>
                <!-- Response info -->
                <div
                  v-if="getResultAtIndex(idx)?.result"
                  class="runner-result-row__meta">
                  <span
                    class="runner-result-row__status"
                    :class="{
                      'runner-result-row__status--success':
                        getResultAtIndex(idx)!.result!.status >= 200 &&
                        getResultAtIndex(idx)!.result!.status < 300,
                      'runner-result-row__status--error':
                        getResultAtIndex(idx)!.result!.status >= 400,
                    }">
                    {{ getResultAtIndex(idx)!.result!.status }}
                  </span>
                  <span class="runner-result-row__duration">
                    {{ Math.round(getResultAtIndex(idx)!.result!.duration) }}ms
                  </span>
                </div>
                <div
                  v-else-if="isResultSkipped(idx)"
                  class="runner-result-row__meta">
                  <span class="text-c-3">Skipped</span>
                </div>
                <!-- Network/build error -->
                <p
                  v-if="getResultAtIndex(idx)?.error"
                  class="runner-result-row__error">
                  {{ getResultAtIndex(idx)!.error!.message }}
                </p>
                <!-- Failed test assertions -->
                <div
                  v-if="getFailedTests(getResultAtIndex(idx)).length > 0"
                  class="runner-result-row__tests">
                  <p
                    v-for="(test, testIdx) in getFailedTests(
                      getResultAtIndex(idx),
                    )"
                    :key="testIdx"
                    class="runner-result-row__test-error">
                    <span class="runner-result-row__test-title">{{
                      test.title
                    }}</span>
                    <span
                      v-if="test.error"
                      class="runner-result-row__test-message">
                      {{ test.error }}
                    </span>
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Section>
</template>

<style scoped>
.runner-card {
  border-radius: 0.75rem;
  border: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-2);
  padding: 1rem 1.25rem;
}

.runner-card__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--scalar-color-1, currentColor);
  letter-spacing: 0.02em;
  margin: 0 0 0.25rem 0;
}

.runner-card__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.runner-card__subtitle {
  font-size: 0.75rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.runner-tree-wrapper {
  max-height: 28rem;
  overflow-y: auto;
}

.runner-tree-wrapper--locked {
  opacity: 0.6;
}

.runner-empty {
  padding: 1.5rem 0;
  text-align: center;
}

.runner-empty--compact {
  padding: 1rem 0;
}

.runner-link {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--scalar-color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
}

.runner-link:hover {
  text-decoration: underline;
}

.runner-order-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.runner-order-list--locked {
  opacity: 0.6;
}

.runner-order-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.5rem 0.5rem 0.25rem;
  border-radius: 0.5rem;
  border: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-1);
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease,
    border-color 0.15s ease;
  cursor: grab;
}

.runner-order-item--locked {
  cursor: default;
  padding-left: 0.5rem;
}

.runner-order-item:hover {
  background: var(--scalar-background-3);
}

.runner-order-item--locked:hover {
  background: var(--scalar-background-1);
}

.runner-order-item:active {
  cursor: grabbing;
}

.runner-order-item--locked:active {
  cursor: default;
}

.runner-order-item--dragging {
  opacity: 0.5;
  border-style: dashed;
}

.runner-order-item--drag-before::before {
  content: '';
  position: absolute;
  top: -0.25rem;
  left: 0;
  right: 0;
  height: 0.25rem;
  background: var(--scalar-color-accent);
  border-radius: 0.125rem;
}

.runner-order-item--drag-after::after {
  content: '';
  position: absolute;
  bottom: -0.25rem;
  left: 0;
  right: 0;
  height: 0.25rem;
  background: var(--scalar-color-accent);
  border-radius: 0.125rem;
}

.runner-order-item__drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--scalar-color-3);
  cursor: grab;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: color 0.15s ease;
}

.runner-order-item__drag-handle:hover {
  color: var(--scalar-color-1);
}

.runner-order-item:active .runner-order-item__drag-handle {
  cursor: grabbing;
}

.runner-order-item__index {
  flex-shrink: 0;
  width: 1.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--scalar-color-3);
  text-align: center;
}

.runner-order-item__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.runner-order-item__path {
  flex: 1;
  min-width: 0;
  font-size: 0.8125rem;
  color: var(--scalar-color-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runner-order-item__example {
  flex-shrink: 0;
  font-size: 0.6875rem;
  color: var(--scalar-color-3);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: var(--scalar-background-3);
}

.runner-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--scalar-color-3);
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.runner-icon-btn:hover:not(:disabled) {
  color: var(--scalar-color-1);
  background: var(--scalar-background-3);
}

.runner-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.runner-icon-btn--danger:hover:not(:disabled) {
  color: var(--scalar-color-red);
}

.runner-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.25rem;
}

.runner-run-btn {
  min-width: 10rem;
}

.runner-progress {
  padding: 0.75rem 1.25rem;
}

.runner-progress__bar {
  height: 0.375rem;
  margin-top: 0.5rem;
  border-radius: 9999px;
  background: var(--scalar-background-3);
  overflow: hidden;
}

.runner-progress__fill {
  height: 100%;
  border-radius: 9999px;
  background: var(--scalar-color-accent);
  transition: width 0.2s ease;
}

.runner-results {
  border-radius: 0.75rem;
  border: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-2);
  overflow: hidden;
}

.runner-results--success {
  border-color: color-mix(in srgb, var(--scalar-color-green) 30%, transparent);
}

.runner-results--failure {
  border-color: color-mix(in srgb, var(--scalar-color-red) 30%, transparent);
}

.runner-results__banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--scalar-border-color);
}

.runner-results--success .runner-results__banner {
  background: color-mix(in srgb, var(--scalar-color-green) 8%, transparent);
  border-bottom-color: color-mix(
    in srgb,
    var(--scalar-color-green) 15%,
    transparent
  );
}

.runner-results--failure .runner-results__banner {
  background: color-mix(in srgb, var(--scalar-color-red) 8%, transparent);
  border-bottom-color: color-mix(
    in srgb,
    var(--scalar-color-red) 15%,
    transparent
  );
}

.runner-results__banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.runner-results--success .runner-results__banner-icon {
  color: var(--scalar-color-green);
}

.runner-results--failure .runner-results__banner-icon {
  color: var(--scalar-color-red);
}

.runner-results__banner-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.runner-results__banner-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--scalar-color-1);
}

.runner-results__banner-meta {
  font-size: 0.75rem;
  color: var(--scalar-color-3);
}

.runner-results__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--scalar-color-3);
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.runner-results__clear:hover {
  color: var(--scalar-color-1);
  background: var(--scalar-background-3);
}

.runner-results__stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-1);
}

.runner-results__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
}

.runner-results__stat--pass {
  color: var(--scalar-color-green);
  background: color-mix(in srgb, var(--scalar-color-green) 12%, transparent);
}

.runner-results__stat--fail {
  color: var(--scalar-color-red);
  background: color-mix(in srgb, var(--scalar-color-red) 12%, transparent);
}

.runner-results__stat--skip {
  color: var(--scalar-color-3);
  background: var(--scalar-background-3);
}

.runner-results__list {
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 20rem;
  overflow-y: auto;
}

.runner-result-row {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  background: var(--scalar-background-1);
  border: 1px solid var(--scalar-border-color);
  transition:
    background 0.15s,
    border-color 0.15s;
}

.runner-result-row:hover {
  border-color: var(--scalar-color-3);
}

.runner-result-row--passed {
  background: color-mix(in srgb, var(--scalar-color-green) 4%, var(--scalar-background-1));
}

.runner-result-row--passed:hover {
  background: color-mix(in srgb, var(--scalar-color-green) 8%, var(--scalar-background-1));
}

.runner-result-row--failed {
  background: color-mix(in srgb, var(--scalar-color-red) 4%, var(--scalar-background-1));
}

.runner-result-row--failed:hover {
  background: color-mix(in srgb, var(--scalar-color-red) 8%, var(--scalar-background-1));
}

.runner-result-row--skipped {
  opacity: 0.6;
}

.runner-result-row__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  margin-top: 0.0625rem;
}

.runner-result-row--passed .runner-result-row__indicator {
  color: var(--scalar-color-green);
  background: color-mix(in srgb, var(--scalar-color-green) 15%, transparent);
}

.runner-result-row--failed .runner-result-row__indicator {
  color: var(--scalar-color-red);
  background: color-mix(in srgb, var(--scalar-color-red) 15%, transparent);
}

.runner-result-row--skipped .runner-result-row__indicator {
  color: var(--scalar-color-3);
  background: var(--scalar-background-3);
}

.runner-result-row__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.runner-result-row__header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.runner-result-row__index {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--scalar-color-3);
  background: var(--scalar-background-3);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.runner-result-row__path {
  font-weight: 500;
  color: var(--scalar-color-2);
  word-break: break-all;
}

.runner-result-row__example {
  font-size: 0.6875rem;
  color: var(--scalar-color-3);
  background: var(--scalar-background-3);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.runner-result-row__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.runner-result-row__status {
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.runner-result-row__status--success {
  color: var(--scalar-color-green);
  background: color-mix(in srgb, var(--scalar-color-green) 12%, transparent);
}

.runner-result-row__status--error {
  color: var(--scalar-color-red);
  background: color-mix(in srgb, var(--scalar-color-red) 12%, transparent);
}

.runner-result-row__duration {
  color: var(--scalar-color-3);
}

.runner-result-row__error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--scalar-color-red);
  line-height: 1.4;
  padding: 0.375rem 0.5rem;
  background: color-mix(in srgb, var(--scalar-color-red) 8%, transparent);
  border-radius: 0.25rem;
}

.runner-result-row__tests {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--scalar-color-red) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--scalar-color-red) 15%, transparent);
}

.runner-result-row__test-error {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
}

.runner-result-row__test-title {
  font-weight: 500;
  color: var(--scalar-color-red);
}

.runner-result-row__test-message {
  display: block;
  color: var(--scalar-color-2);
  margin-top: 0.125rem;
  font-size: 0.6875rem;
}
</style>
