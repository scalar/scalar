<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  value: unknown
  path?: string
  depth?: number
}>()

const isExpanded = ref(false)
const seen = new WeakSet()

const type = computed(() => {
  if (props.value === null) return 'null'
  if (Array.isArray(props.value)) return 'array'
  return typeof props.value
})

const isExpandable = computed(() => {
  if (props.value === null) return false
  if (Array.isArray(props.value)) return props.value.length > 0
  return (
    type.value === 'object' && Object.keys(props.value as object).length > 0
  )
})

const toggleExpand = () => {
  if (!isExpandable.value) return
  isExpanded.value = !isExpanded.value
}

const getValueDisplay = (value: unknown): string => {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `[${value.length} items]`
    return `{${Object.keys(value as object).length} keys}`
  }
  return String(value)
}

// Track seen objects to detect circular references
if (props.value !== null && typeof props.value === 'object') {
  seen.add(props.value as object)
}
</script>

<template>
  <div class="relative mb-2 rounded-md border px-2 py-2 text-xs">
    <div class="flex items-center gap-2">
      <button
        v-if="isExpandable"
        @click="toggleExpand"
        class="flex h-5 w-5 items-center justify-center rounded border"
        :aria-label="isExpanded ? 'Collapse' : 'Expand'">
        <svg
          :class="['h-3 w-3', isExpanded ? 'rotate-90' : '']"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <span
        v-if="path"
        class="select-none font-mono"
        >{{ path }}:</span
      >
      <span class="font-mono">{{ type }}</span>
    </div>

    <div class="mt-1">
      <template v-if="!isExpandable || !isExpanded">
        <span class="font-mono text-gray-400">{{
          getValueDisplay(value)
        }}</span>
      </template>
    </div>

    <div
      v-if="isExpanded"
      class="relative mt-2">
      <template v-if="Array.isArray(value)">
        <TreeView
          v-for="(item, index) in value"
          :key="index"
          :value="item"
          :path="String(index)"
          :depth="(depth ?? 0) + 1" />
      </template>
      <template v-else-if="typeof value === 'object' && value !== null">
        <TreeView
          v-for="(val, key) in value"
          :key="key"
          :value="val"
          :path="key"
          :depth="(depth ?? 0) + 1" />
      </template>
    </div>
  </div>
</template>
