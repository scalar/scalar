<script setup lang="ts">
import { ScalarButton, useLoadingState } from '@scalar/components'
import {
  ScalarIconArrowDown,
  ScalarIconArrowUp,
  ScalarIconCheckCircle,
  ScalarIconPlay,
  ScalarIconTrash,
  ScalarIconXCircle,
} from '@scalar/icons'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'
import {
  runOperationExamplesRunner,
  type OperationExampleRunItem,
  type OperationExampleRunResult,
  type RunOperationExamplesContext,
} from '@/v2/blocks/operation-block/helpers/run-operation-examples-runner'
import { getOperationRequestParams } from '@/v2/blocks/operation-block/helpers/get-operation-request-params'
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

const selectedOrder = ref<SelectedItem[]>([])
const isRunning = ref(false)
const runResults = ref<OperationExampleRunResult[] | null>(null)
const currentRunIndex = ref<number | null>(null)
const runLoader = useLoadingState()

const navigationChildren = computed(() => {
  if (props.collectionType !== 'document' || !props.document) {
    return []
  }
  const nav = props.document['x-scalar-navigation']
  return nav?.children ?? []
})

const hasOperations = computed(() => navigationChildren.value.length > 0)

/** Check if this (path, method, exampleKey) is in the selected list */
function isSelected(path: string, method: HttpMethod, exampleKey: string): boolean {
  return selectedOrder.value.some(
    (s) => s.path === path && s.method === method && s.exampleKey === exampleKey,
  )
}

/** Toggle selection of an operation example */
function toggle(path: string, method: HttpMethod, exampleKey: string, label: string): void {
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
  selectedOrder.value = []
}

function removeFromOrder(item: SelectedItem): void {
  selectedOrder.value = selectedOrder.value.filter((s) => s.id !== item.id)
}

function moveUp(index: number): void {
  if (index <= 0) {
    return
  }
  const list = [...selectedOrder.value]
  ;[list[index - 1], list[index]] = [list[index]!, list[index - 1]!]
  selectedOrder.value = list
}

function moveDown(index: number): void {
  if (index >= selectedOrder.value.length - 1) {
    return
  }
  const list = [...selectedOrder.value]
  ;[list[index], list[index + 1]] = [list[index + 1]!, list[index]!]
  selectedOrder.value = list
}

/** Build run items from selected order and resolve operations from document */
function buildRunItems(): OperationExampleRunItem[] {
  const doc = props.document as OpenApiDocument
  const documentSlug = props.documentSlug
  const items: OperationExampleRunItem[] = []

  for (const sel of selectedOrder.value) {
    const params = getOperationRequestParams({
      workspaceStore: props.workspaceStore,
      document: doc,
      path: sel.path,
      method: sel.method,
      documentSlug,
      layout: props.layout,
    })
    if (!params.operation) {
      continue
    }
    items.push({
      document: doc,
      operation: params.operation,
      path: sel.path,
      method: sel.method,
      exampleKey: sel.exampleKey,
      documentSlug,
    })
  }
  return items
}

async function run(): Promise<void> {
  const doc = props.document
  if (
    props.collectionType !== 'document' ||
    !doc ||
    selectedOrder.value.length === 0
  ) {
    return
  }

  const items = buildRunItems()
  if (items.length === 0) {
    return
  }

  const context: RunOperationExamplesContext = {
    workspaceStore: props.workspaceStore,
    layout: props.layout,
    plugins: props.plugins,
    eventBus: props.eventBus,
  }

  isRunning.value = true
  runResults.value = null
  currentRunIndex.value = 0
  try {
    runLoader.start()
    const results = await runOperationExamplesRunner(items, context, (_result, index) => {
      currentRunIndex.value = index + 1
    })
    runResults.value = results
  } finally {
    isRunning.value = false
    currentRunIndex.value = null
    runLoader.clear()
  }
}

const hasSelection = computed(() => selectedOrder.value.length > 0)
const runSummary = computed(() => {
  const results = runResults.value
  if (!results?.length) {
    return null
  }
  const failed = results.filter((r) => r.error).length
  const passed = results.length - failed
  return { total: results.length, passed, failed }
})

/** Get result by index (results match selected order 1:1) */
function getResultAtIndex(index: number): OperationExampleRunResult | undefined {
  return runResults.value?.[index]
}
</script>

<template>
  <Section v-if="collectionType === 'document'">
    <template #title>Runner</template>
    <template #description>
      Select operation examples, set the run order, then run them in sequence.
      Variables set by pre-request or post-response scripts are shared between runs.
    </template>

    <div class="flex flex-col gap-8 lg:flex-row lg:items-start">
      <!-- Left: Document operations tree -->
      <div class="runner-card min-w-0 flex-1">
        <h3 class="runner-card__title">Select operations</h3>
        <p class="text-c-2 runner-card__subtitle">
          Check the examples you want to run. They will be added to the run order.
        </p>
        <div v-if="hasOperations" class="runner-tree-wrapper">
          <RunnerTree
            :entries="navigationChildren"
            :selected-order="selectedOrder"
            :is-selected="isSelected"
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
              v-if="hasSelection"
              type="button"
              class="runner-link"
              @click="clearAll">
              Clear all
            </button>
          </div>
          <p class="text-c-2 runner-card__subtitle">
            {{ selectedOrder.length }} {{ selectedOrder.length === 1 ? 'item' : 'items' }} selected.
            Reorder with the arrows or remove with the trash icon.
          </p>

          <div v-if="selectedOrder.length > 0" class="runner-order-list">
            <div
              v-for="(item, index) in selectedOrder"
              :key="item.id"
              class="runner-order-item">
              <span class="runner-order-item__index" aria-hidden="true">{{ index + 1 }}</span>
              <div class="runner-order-item__main">
                <HttpMethodBadge :method="item.method" />
                <span class="runner-order-item__path" :title="item.path">{{ item.path }}</span>
                <span class="runner-order-item__example">{{ item.exampleKey }}</span>
              </div>
              <div class="runner-order-item__actions">
                <button
                  type="button"
                  class="runner-icon-btn"
                  :disabled="index === 0"
                  :aria-label="`Move up`"
                  @click="moveUp(index)">
                  <ScalarIconArrowUp class="size-4" />
                </button>
                <button
                  type="button"
                  class="runner-icon-btn"
                  :disabled="index === selectedOrder.length - 1"
                  :aria-label="`Move down`"
                  @click="moveDown(index)">
                  <ScalarIconArrowDown class="size-4" />
                </button>
                <button
                  type="button"
                  class="runner-icon-btn runner-icon-btn--danger"
                  :aria-label="`Remove from run order`"
                  @click="removeFromOrder(item)">
                  <ScalarIconTrash class="size-4" />
                </button>
              </div>
            </div>
          </div>
          <div v-else class="runner-empty runner-empty--compact">
            <p class="text-c-3 text-sm">No items yet.</p>
            <p class="text-c-3 mt-0.5 text-xs">Select operations from the list on the left.</p>
          </div>
        </div>

        <!-- Run button -->
        <div class="runner-actions">
          <ScalarButton
            variant="gradient"
            size="md"
            :icon="ScalarIconPlay"
            :loader="runLoader"
            :disabled="!hasSelection || isRunning"
            class="runner-run-btn"
            @click="run">
            Run sequence
          </ScalarButton>
        </div>

        <!-- Running progress -->
        <div
          v-if="isRunning && currentRunIndex != null && selectedOrder.length > 0"
          class="runner-card runner-progress">
          <p class="text-c-2 text-sm">
            Running step
            <span class="text-c-1 font-medium">{{ currentRunIndex }} / {{ selectedOrder.length }}</span>
          </p>
          <div
            class="runner-progress__bar"
            role="progressbar"
            :aria-valuenow="currentRunIndex"
            :aria-valuemin="0"
            :aria-valuemax="selectedOrder.length">
            <div
              class="runner-progress__fill"
              :style="{ width: `${(currentRunIndex / selectedOrder.length) * 100}%` }" />
          </div>
        </div>

        <!-- Results -->
        <div
          v-if="runSummary && runResults && runResults.length > 0"
          class="runner-card runner-results">
          <h3 class="runner-card__title">Last run</h3>
          <div class="runner-results__summary">
            <span class="runner-results__stat runner-results__stat--pass">
              <ScalarIconCheckCircle class="size-4 shrink-0" />
              {{ runSummary.passed }} passed
            </span>
            <span
              v-if="runSummary.failed > 0"
              class="runner-results__stat runner-results__stat--fail">
              <ScalarIconXCircle class="size-4 shrink-0" />
              {{ runSummary.failed }} failed
            </span>
            <span class="text-c-3 text-sm"> of {{ runSummary.total }}</span>
          </div>
          <ul class="runner-results__list" aria-label="Run results">
            <li
              v-for="(item, idx) in selectedOrder"
              :key="item.id"
              class="runner-result-row">
              <template v-if="getResultAtIndex(idx)">
                <ScalarIconCheckCircle
                  v-if="!getResultAtIndex(idx)?.error"
                  class="size-4 shrink-0 text-[var(--scalar-color-green)]"
                  aria-hidden="true" />
                <ScalarIconXCircle
                  v-else
                  class="size-4 shrink-0 text-[var(--scalar-color-red)]"
                  aria-hidden="true" />
                <div class="runner-result-row__content">
                  <span class="runner-result-row__label">
                    <HttpMethodBadge :method="item.method" />
                    {{ item.path }}
                    <span class="text-c-3"> — {{ item.exampleKey }}</span>
                  </span>
                  <template v-if="getResultAtIndex(idx)?.result">
                    <span class="text-c-3 text-xs">
                      {{ getResultAtIndex(idx)!.result!.response.status }}
                      ·
                      {{ getResultAtIndex(idx)!.result!.response.duration }} ms
                    </span>
                  </template>
                  <p
                    v-else-if="getResultAtIndex(idx)?.error"
                    class="runner-result-row__error">
                    {{ getResultAtIndex(idx)!.error!.message }}
                  </p>
                </div>
              </template>
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

.runner-order-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-1);
  transition: background-color 0.15s ease;
}

.runner-order-item:hover {
  background: var(--scalar-background-3);
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

.runner-order-item__actions {
  display: flex;
  align-items: center;
  gap: 0.125rem;
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
  transition: color 0.15s, background 0.15s;
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

.runner-results__summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}

.runner-results__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

.runner-results__stat--pass {
  color: var(--scalar-color-green);
}

.runner-results__stat--fail {
  color: var(--scalar-color-red);
}

.runner-results__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.runner-result-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
}

.runner-result-row__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.runner-result-row__label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.runner-result-row__error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--scalar-color-red);
  line-height: 1.3;
}
</style>
