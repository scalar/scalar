<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import { SchemaGutterToggle, SchemaRailPanel } from '../schema'

const {
  name,
  value,
  depth = 0,
  ancestors = [],
} = defineProps<{
  name: string
  value: unknown
  depth?: number
  /** Only ancestors count as cycles; shared sibling values remain independently expandable. */
  ancestors?: readonly unknown[]
}>()

const nameId = useId()
const panelId = useId()
const open = ref(depth === 0)
const circular = computed<boolean>(() => ancestors.includes(value))
const children = computed<[string, unknown][]>(() => {
  if (value === null || typeof value !== 'object' || circular.value) {
    return []
  }
  return Array.isArray(value)
    ? value.map((item, index) => [`[${index}]`, item])
    : Object.entries(value)
})
const expandable = computed<boolean>(() => children.value.length > 0)
const type = computed<string>(() => {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return `array[${value.length}]`
  }
  return typeof value
})
const text = computed<string>(() => {
  if (circular.value) {
    return '[Circular]'
  }
  if (typeof value === 'string') {
    return JSON.stringify(value)
  }
  if (value !== null && typeof value === 'object') {
    return Array.isArray(value) ? '[]' : '{}'
  }
  return String(value)
})
</script>

<template>
  <div class="relative min-w-0 py-1.5">
    <dt class="flex min-h-6 min-w-0 flex-wrap items-baseline gap-x-2">
      <SchemaGutterToggle
        v-if="expandable"
        class="absolute start-0 top-1.5"
        :fallbackLabel="name"
        :nameId="nameId"
        :open="open"
        :panelId="panelId"
        :panelRendered="open"
        @toggle="open = !open" />
      <span
        :id="nameId"
        class="font-code min-w-0 ps-8 font-medium break-words"
        >{{ name }}</span
      >
      <span class="text-c-2 text-sm">{{ type }}</span>
    </dt>
    <SchemaRailPanel
      v-if="expandable && open"
      :id="panelId"
      as="dd"
      class="ms-3 mt-1"
      :depth="depth + 1">
      <dl>
        <ExtensionValue
          v-for="[childName, childValue] in children"
          :key="childName"
          :ancestors="[...ancestors, value]"
          :depth="depth + 1"
          :name="childName"
          :value="childValue" />
      </dl>
    </SchemaRailPanel>
    <dd
      v-else-if="!expandable"
      class="text-c-2 ps-8">
      <code class="font-code break-words whitespace-pre-wrap">{{ text }}</code>
    </dd>
  </div>
</template>
