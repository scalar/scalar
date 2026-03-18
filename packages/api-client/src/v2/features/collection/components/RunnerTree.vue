<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { computed } from 'vue'
import type {
  TraversedEntry,
  TraversedExample,
  TraversedOperation,
} from '@scalar/workspace-store/schemas/navigation'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

type SelectedItem = { id: string; path: string; method: HttpMethod; exampleKey: string; label: string }

const props = defineProps<{
  entries: TraversedEntry[]
  selectedOrder: SelectedItem[]
  isSelected: (path: string, method: HttpMethod, exampleKey: string) => boolean
  depth?: number
}>()

const emit = defineEmits<{
  toggle: [path: string, method: HttpMethod, exampleKey: string, label: string]
}>()

const depth = computed(() => props.depth ?? 0)

function getExamplesForOperation(op: TraversedOperation): { id: string; name: string }[] {
  const examples = op.children?.filter(
    (c): c is TraversedExample => c.type === 'example',
  )
  if (examples?.length) {
    return examples.map((e) => ({ id: e.id, name: e.name }))
  }
  return [{ id: `${op.id}/default`, name: 'default' }]
}

function handleToggle(
  path: string,
  method: HttpMethod,
  exampleKey: string,
): void {
  const label = `${method.toUpperCase()} ${path} — ${exampleKey}`
  emit('toggle', path, method, exampleKey, label)
}
</script>

<template>
  <ul
    class="runner-tree list-none"
    :class="{ 'runner-tree--nested': depth > 0 }"
    :style="depth > 0 ? { paddingLeft: '1.25rem' } : undefined">
    <template v-for="entry in entries" :key="entry.id">
      <!-- Operation: card with method + path, then example checkboxes -->
      <li v-if="entry.type === 'operation'" class="runner-tree__op">
        <div class="runner-tree__op-header">
          <HttpMethodBadge :method="entry.method" />
          <span class="runner-tree__op-path">{{ entry.path }}</span>
        </div>
        <div class="runner-tree__examples">
          <label
            v-for="ex in getExamplesForOperation(entry)"
            :key="ex.id"
            class="runner-tree__example"
            :class="{ 'runner-tree__example--selected': isSelected(entry.path, entry.method, ex.name) }">
            <input
              type="checkbox"
              :checked="isSelected(entry.path, entry.method, ex.name)"
              class="runner-tree__checkbox"
              @change="handleToggle(entry.path, entry.method, ex.name)">
            <span class="runner-tree__example-name">{{ ex.name }}</span>
          </label>
        </div>
      </li>

      <!-- Tag or group: recurse -->
      <li
        v-else-if="'children' in entry && entry.children?.length"
        class="runner-tree__group">
        <p class="runner-tree__group-title">{{ entry.title }}</p>
        <RunnerTree
          :entries="entry.children"
          :selected-order="selectedOrder"
          :is-selected="isSelected"
          :depth="depth + 1"
          @toggle="(path, method, exampleKey, label) => $emit('toggle', path, method, exampleKey, label)" />
      </li>
    </template>
  </ul>
</template>

<style scoped>
.runner-tree--nested {
  border-left: 2px solid var(--scalar-border-color);
  margin-left: 0.25rem;
}

.runner-tree__op {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-1);
}

.runner-tree__op:last-child {
  margin-bottom: 0;
}

.runner-tree__op-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.runner-tree__op-path {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--scalar-color-2);
  word-break: break-all;
}

.runner-tree__examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
}

.runner-tree__example {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--scalar-color-2);
  transition: background 0.15s, color 0.15s;
}

.runner-tree__example:hover {
  background: var(--scalar-background-3);
  color: var(--scalar-color-1);
}

.runner-tree__example--selected {
  background: var(--scalar-background-3);
  color: var(--scalar-color-1);
}

.runner-tree__checkbox {
  width: 1rem;
  height: 1rem;
  margin: 0;
  accent-color: var(--scalar-color-accent);
  cursor: pointer;
}

.runner-tree__example-name {
  user-select: none;
}

.runner-tree__group {
  margin-bottom: 1rem;
}

.runner-tree__group:last-child {
  margin-bottom: 0;
}

.runner-tree__group-title {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--scalar-color-3);
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--scalar-border-color);
}
</style>
