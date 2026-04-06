<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type {
  TraversedEntry,
  TraversedExample,
  TraversedOperation,
} from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import type { SelectedItem } from '../hooks'
import RunnerTreeGroup from './RunnerTreeGroup.vue'
import RunnerTreeOperation from './RunnerTreeOperation.vue'

const props = defineProps<{
  entries: TraversedEntry[]
  selectedOrder: SelectedItem[]
  isSelected: (path: string, method: HttpMethod, exampleKey: string) => boolean
  depth?: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  (
    e: 'toggle',
    path: string,
    method: HttpMethod,
    exampleKey: string,
    label: string,
  ): void
}>()

const depth = computed(() => props.depth ?? 0)

const ALLOWED_TYPES = new Set(['document', 'operation', 'example', 'tag'])

const filterEntries = (entries: TraversedEntry[]): TraversedEntry[] => {
  return entries.filter((entry) => ALLOWED_TYPES.has(entry.type))
}

const filteredEntries = computed(() => filterEntries(props.entries))

const getExamplesForOperation = (
  op: TraversedOperation,
): { id: string; name: string }[] => {
  const examples = op.children?.filter(
    (c): c is TraversedExample => c.type === 'example',
  )
  if (examples?.length) {
    return examples.map((e) => ({ id: e.id, name: e.name }))
  }
  return [{ id: `${op.id}/default`, name: 'default' }]
}

const getSelectionIndex = (
  path: string,
  method: HttpMethod,
  exampleKey: string,
): number => {
  const idx = props.selectedOrder.findIndex(
    (s) =>
      s.path === path && s.method === method && s.exampleKey === exampleKey,
  )
  return idx >= 0 ? idx + 1 : -1
}

const handleToggle = (
  path: string,
  method: HttpMethod,
  exampleKey: string,
): void => {
  if (props.disabled) {
    return
  }
  const label = `${method.toUpperCase()} ${path} — ${exampleKey}`
  emit('toggle', path, method, exampleKey, label)
}

const isOperationFullySelected = (op: TraversedOperation): boolean => {
  const examples = getExamplesForOperation(op)
  return examples.every((ex) => props.isSelected(op.path, op.method, ex.name))
}

const toggleAllExamples = (op: TraversedOperation): void => {
  const examples = getExamplesForOperation(op)
  const allSelected = isOperationFullySelected(op)

  for (const ex of examples) {
    const isCurrentlySelected = props.isSelected(op.path, op.method, ex.name)
    if (allSelected && isCurrentlySelected) {
      handleToggle(op.path, op.method, ex.name)
    } else if (!allSelected && !isCurrentlySelected) {
      handleToggle(op.path, op.method, ex.name)
    }
  }
}

type GroupStats = { total: number; selected: number }

/**
 * Recursively computes selection statistics for a subtree of entries.
 *
 * Walks through all filtered entries and their children to count:
 * - total: the number of selectable examples across all operations
 * - selected: how many of those examples are currently selected
 *
 * This is an internal helper used by groupStatsMap to build the cache.
 */
const computeGroupStats = (entries: TraversedEntry[]): GroupStats => {
  let total = 0
  let selected = 0

  const filtered = filterEntries(entries)
  for (const entry of filtered) {
    if (entry.type === 'operation') {
      const examples = getExamplesForOperation(entry)
      total += examples.length
      selected += examples.filter((ex) =>
        props.isSelected(entry.path, entry.method, ex.name),
      ).length
    } else if ('children' in entry && entry.children?.length) {
      const childStats = computeGroupStats(entry.children)
      total += childStats.total
      selected += childStats.selected
    }
  }

  return { total, selected }
}

/**
 * Pre-computed map of group statistics keyed by entry ID.
 *
 * This computed property builds a cache of stats for all group entries
 * (tags, documents with children) in a single pass. The template can then
 * do O(1) lookups instead of repeatedly traversing the tree.
 */
const groupStatsMap = computed(() => {
  const map = new Map<string, GroupStats>()
  for (const entry of filteredEntries.value) {
    if ('children' in entry && entry.children?.length) {
      const filteredChildren = filterEntries(entry.children)
      if (filteredChildren.length > 0) {
        map.set(entry.id, computeGroupStats(entry.children))
      }
    }
  }
  return map
})

/**
 * Checks whether an entry is a valid group (has children with selectable content).
 *
 * Returns true if the entry exists in the pre-computed groupStatsMap,
 * meaning it has filtered children that should be rendered as a collapsible group.
 */
const isGroupEntry = (entry: TraversedEntry): boolean => {
  return groupStatsMap.value.has(entry.id)
}

/**
 * Retrieves the pre-computed selection statistics for a group entry.
 *
 * Returns the cached { total, selected } stats from groupStatsMap.
 * Falls back to zeros if the entry is not found (should not happen
 * if isGroupEntry was checked first).
 */
const getGroupStats = (entry: TraversedEntry): GroupStats => {
  return groupStatsMap.value.get(entry.id) ?? { total: 0, selected: 0 }
}
</script>

<template>
  <ul
    class="flex list-none flex-col gap-2 p-0"
    :class="[disabled && 'pointer-events-none opacity-60']">
    <template
      v-for="entry in filteredEntries"
      :key="entry.id">
      <!-- Operation -->
      <RunnerTreeOperation
        v-if="entry.type === 'operation'"
        :examples="getExamplesForOperation(entry)"
        :getSelectionIndex="
          (exampleName) =>
            getSelectionIndex(entry.path, entry.method, exampleName)
        "
        :isDisabled="disabled"
        :isFullySelected="isOperationFullySelected(entry)"
        :isSelected="
          (exampleName) => isSelected(entry.path, entry.method, exampleName)
        "
        :method="entry.method"
        :path="entry.path"
        @toggle="
          (exampleName) => handleToggle(entry.path, entry.method, exampleName)
        "
        @toggleAll="toggleAllExamples(entry)" />

      <!-- Group (tag/document with children) -->
      <RunnerTreeGroup
        v-else-if="isGroupEntry(entry)"
        :selectedCount="getGroupStats(entry).selected"
        :title="entry.title"
        :totalCount="getGroupStats(entry).total">
        <RunnerTree
          :depth="depth + 1"
          :disabled="disabled"
          :entries="'children' in entry ? (entry.children ?? []) : []"
          :isSelected="isSelected"
          :selectedOrder="selectedOrder"
          @toggle="
            (path, method, exampleKey, label) =>
              emit('toggle', path, method, exampleKey, label)
          " />
      </RunnerTreeGroup>
    </template>
  </ul>
</template>
