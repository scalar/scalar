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

const getGroupStats = (
  entries: TraversedEntry[],
): {
  total: number
  selected: number
} => {
  let total = 0
  let selected = 0

  for (const entry of entries) {
    if (entry.type === 'operation') {
      const examples = getExamplesForOperation(entry)
      total += examples.length
      selected += examples.filter((ex) =>
        props.isSelected(entry.path, entry.method, ex.name),
      ).length
    } else if ('children' in entry && entry.children?.length) {
      const childStats = getGroupStats(entry.children)
      total += childStats.total
      selected += childStats.selected
    }
  }

  return { total, selected }
}
</script>

<template>
  <ul
    class="flex list-none flex-col gap-2 p-0"
    :class="[disabled && 'pointer-events-none opacity-60']">
    <template
      v-for="entry in entries"
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

      <!-- Group -->
      <RunnerTreeGroup
        v-else-if="'children' in entry && entry.children?.length"
        :selectedCount="getGroupStats(entry.children).selected"
        :title="entry.title"
        :totalCount="getGroupStats(entry.children).total">
        <RunnerTree
          :depth="depth + 1"
          :disabled="disabled"
          :entries="entry.children"
          :isSelected="isSelected"
          :selectedOrder="selectedOrder"
          @toggle="
            (path, method, exampleKey, label) =>
              $emit('toggle', path, method, exampleKey, label)
          " />
      </RunnerTreeGroup>
    </template>
  </ul>
</template>
