<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { ScalarIconCaretDown, ScalarIconCaretRight } from '@scalar/icons'
import type {
  TraversedEntry,
  TraversedExample,
  TraversedOperation,
} from '@scalar/workspace-store/schemas/navigation'
import { computed, ref } from 'vue'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

type SelectedItem = {
  id: string
  path: string
  method: HttpMethod
  exampleKey: string
  label: string
}

const props = defineProps<{
  entries: TraversedEntry[]
  selectedOrder: SelectedItem[]
  isSelected: (path: string, method: HttpMethod, exampleKey: string) => boolean
  depth?: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  toggle: [path: string, method: HttpMethod, exampleKey: string, label: string]
}>()

const depth = computed(() => props.depth ?? 0)

const collapsedGroups = ref<Set<string>>(new Set())

function toggleGroup(groupId: string): void {
  if (collapsedGroups.value.has(groupId)) {
    collapsedGroups.value.delete(groupId)
  } else {
    collapsedGroups.value.add(groupId)
  }
}

function isGroupCollapsed(groupId: string): boolean {
  return collapsedGroups.value.has(groupId)
}

function getExamplesForOperation(
  op: TraversedOperation,
): { id: string; name: string }[] {
  const examples = op.children?.filter(
    (c): c is TraversedExample => c.type === 'example',
  )
  if (examples?.length) {
    return examples.map((e) => ({ id: e.id, name: e.name }))
  }
  return [{ id: `${op.id}/default`, name: 'default' }]
}

function getSelectionIndex(
  path: string,
  method: HttpMethod,
  exampleKey: string,
): number {
  const idx = props.selectedOrder.findIndex(
    (s) =>
      s.path === path && s.method === method && s.exampleKey === exampleKey,
  )
  return idx >= 0 ? idx + 1 : -1
}

function handleToggle(
  path: string,
  method: HttpMethod,
  exampleKey: string,
): void {
  if (props.disabled) {
    return
  }
  const label = `${method.toUpperCase()} ${path} — ${exampleKey}`
  emit('toggle', path, method, exampleKey, label)
}

function getOperationSelectedCount(op: TraversedOperation): number {
  const examples = getExamplesForOperation(op)
  return examples.filter((ex) =>
    props.isSelected(op.path, op.method, ex.name),
  ).length
}

function isOperationFullySelected(op: TraversedOperation): boolean {
  const examples = getExamplesForOperation(op)
  return examples.every((ex) => props.isSelected(op.path, op.method, ex.name))
}

function toggleAllExamples(op: TraversedOperation): void {
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

function getGroupStats(
  entries: TraversedEntry[],
): { total: number; selected: number } {
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
    class="runner-tree list-none"
    :class="{
      'runner-tree--nested': depth > 0,
      'runner-tree--disabled': disabled,
    }">
    <template
      v-for="entry in entries"
      :key="entry.id">
      <!-- Operation: card with method + path, then example checkboxes -->
      <li
        v-if="entry.type === 'operation'"
        class="runner-tree__op"
        :class="{
          'runner-tree__op--has-selection': getOperationSelectedCount(entry) > 0,
        }">
        <div class="runner-tree__op-header">
          <div class="runner-tree__op-info">
            <HttpMethodBadge :method="entry.method" />
            <span class="runner-tree__op-path">{{ entry.path }}</span>
          </div>
          <button
            v-if="getExamplesForOperation(entry).length > 1 && !disabled"
            class="runner-tree__select-all"
            type="button"
            @click="toggleAllExamples(entry)">
            {{ isOperationFullySelected(entry) ? 'Deselect all' : 'Select all' }}
          </button>
        </div>
        <div class="runner-tree__examples">
          <label
            v-for="ex in getExamplesForOperation(entry)"
            :key="ex.id"
            class="runner-tree__example"
            :class="{
              'runner-tree__example--selected': isSelected(
                entry.path,
                entry.method,
                ex.name,
              ),
              'runner-tree__example--disabled': disabled,
            }">
            <input
              :checked="isSelected(entry.path, entry.method, ex.name)"
              class="runner-tree__checkbox"
              :disabled="disabled"
              type="checkbox"
              @change="handleToggle(entry.path, entry.method, ex.name)" />
            <span class="runner-tree__example-name">{{ ex.name }}</span>
            <span
              v-if="getSelectionIndex(entry.path, entry.method, ex.name) > 0"
              class="runner-tree__example-order">
              #{{ getSelectionIndex(entry.path, entry.method, ex.name) }}
            </span>
          </label>
        </div>
      </li>

      <!-- Tag or group: collapsible with stats -->
      <li
        v-else-if="'children' in entry && entry.children?.length"
        class="runner-tree__group">
        <button
          class="runner-tree__group-header"
          type="button"
          @click="toggleGroup(entry.id)">
          <component
            :is="isGroupCollapsed(entry.id) ? ScalarIconCaretRight : ScalarIconCaretDown"
            class="runner-tree__group-icon" />
          <span class="runner-tree__group-title">{{ entry.title }}</span>
          <span class="runner-tree__group-stats">
            {{ getGroupStats(entry.children).selected }} /
            {{ getGroupStats(entry.children).total }}
          </span>
        </button>
        <div
          v-show="!isGroupCollapsed(entry.id)"
          class="runner-tree__group-content">
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
        </div>
      </li>
    </template>
  </ul>
</template>

<style scoped>
.runner-tree {
  margin: 0;
  padding: 0;
}

.runner-tree--nested {
  padding-left: 0.75rem;
  margin-left: 0.5rem;
  border-left: 2px solid var(--scalar-border-color);
}

.runner-tree--disabled {
  pointer-events: none;
  opacity: 0.6;
}

.runner-tree__op {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-1);
  transition: border-color 0.15s ease;
}

.runner-tree__op--has-selection {
  border-color: var(--scalar-color-accent);
  background: color-mix(in srgb, var(--scalar-color-accent) 3%, var(--scalar-background-1));
}

.runner-tree__op:last-child {
  margin-bottom: 0;
}

.runner-tree__op-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.runner-tree__op-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
}

.runner-tree__op-path {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--scalar-color-2);
  word-break: break-all;
}

.runner-tree__select-all {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--scalar-color-accent);
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.runner-tree__select-all:hover {
  background: var(--scalar-background-3);
}

.runner-tree__examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.runner-tree__example {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--scalar-color-3);
  background: var(--scalar-background-2);
  border: 1px solid transparent;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.runner-tree__example:hover {
  background: var(--scalar-background-3);
  color: var(--scalar-color-1);
}

.runner-tree__example--selected {
  background: color-mix(in srgb, var(--scalar-color-accent) 12%, transparent);
  border-color: var(--scalar-color-accent);
  color: var(--scalar-color-1);
}

.runner-tree__example--disabled {
  cursor: not-allowed;
}

.runner-tree__checkbox {
  width: 0.875rem;
  height: 0.875rem;
  margin: 0;
  accent-color: var(--scalar-color-accent);
  cursor: pointer;
}

.runner-tree__checkbox:disabled {
  cursor: not-allowed;
}

.runner-tree__example-name {
  user-select: none;
}

.runner-tree__example-order {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--scalar-color-accent);
  background: color-mix(in srgb, var(--scalar-color-accent) 15%, transparent);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-left: 0.125rem;
}

.runner-tree__group {
  margin-bottom: 0.75rem;
}

.runner-tree__group:last-child {
  margin-bottom: 0;
}

.runner-tree__group-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--scalar-background-2);
  border: 1px solid var(--scalar-border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.runner-tree__group-header:hover {
  background: var(--scalar-background-3);
}

.runner-tree__group-icon {
  width: 1rem;
  height: 1rem;
  color: var(--scalar-color-3);
  flex-shrink: 0;
}

.runner-tree__group-title {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--scalar-color-2);
  text-align: left;
}

.runner-tree__group-stats {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--scalar-color-3);
  background: var(--scalar-background-3);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.runner-tree__group-content {
  margin-top: 0.5rem;
}
</style>
