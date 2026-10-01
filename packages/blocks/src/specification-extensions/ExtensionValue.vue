<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import { SchemaGutterToggle, SchemaRailPanel } from '../schema'

const {
  name,
  value,
  depth = 0,
  arrayItem = false,
  ancestors = [],
} = defineProps<{
  name: string
  value: unknown
  depth?: number
  /** Array entries display only their values; keep their names for assistive technology. */
  arrayItem?: boolean
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
const label = computed<string>(() => {
  if (arrayItem && expandable.value) {
    return Array.isArray(value) ? '[…]' : '{…}'
  }
  return !arrayItem && !expandable.value ? `${name}:` : name
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
  <div
    class="relative min-w-0 py-0.5"
    :class="{
      'ps-8': depth === 0,
      'flex items-baseline gap-x-2': !arrayItem && !expandable,
    }">
    <dt
      :class="
        arrayItem && !expandable
          ? 'sr-only'
          : 'relative flex min-h-5 min-w-0 flex-wrap items-baseline gap-x-2'
      ">
      <SchemaGutterToggle
        v-if="expandable"
        class="absolute start-[calc(0px_-_var(--schema-gutter,16px)_-_var(--schema-toggle-half,12px))] top-[0.5lh] -translate-y-1/2"
        :fallbackLabel="name"
        :nameId="nameId"
        :open="open"
        :panelId="panelId"
        :panelRendered="open"
        @toggle="open = !open" />
      <span
        :id="nameId"
        :class="{ 'sr-only': arrayItem && !expandable }"
        class="font-code min-w-0 font-medium break-words"
        >{{ label }}</span
      >
    </dt>
    <SchemaRailPanel
      v-if="expandable && open"
      :id="panelId"
      as="dd"
      class="mt-0.5"
      :depth="depth + 1">
      <dl>
        <ExtensionValue
          v-for="[childName, childValue] in children"
          :key="childName"
          :ancestors="[...ancestors, value]"
          :arrayItem="Array.isArray(value)"
          :depth="depth + 1"
          :name="childName"
          :value="childValue" />
      </dl>
    </SchemaRailPanel>
    <dd
      v-else-if="!expandable"
      class="text-c-2 min-w-0"
      :class="{ 'flex-1': !arrayItem }">
      <code class="font-code break-words whitespace-pre-wrap">{{ text }}</code>
    </dd>
  </div>
</template>
