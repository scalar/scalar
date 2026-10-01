<script setup lang="ts">
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { computed } from 'vue'

const { value } = defineProps<{
  value: unknown
}>()

const isPrimitive = (item: unknown): boolean =>
  item === null || ['string', 'number', 'boolean'].includes(typeof item)

const items = computed<string[] | undefined>(() =>
  Array.isArray(value) && value.length > 0 && value.every(isPrimitive)
    ? value.map((item) => String(item))
    : undefined,
)

const text = computed<string>(() => {
  if (value === null) {
    return 'null'
  }
  if (typeof value === 'object') {
    return prettyPrintJson(value)
  }
  return String(value ?? '')
})
</script>

<template>
  <ul
    v-if="items"
    class="list-disc space-y-1 pl-5">
    <li
      v-for="(item, index) in items"
      :key="index"
      class="break-words whitespace-pre-wrap">
      {{ item }}
    </li>
  </ul>
  <pre
    v-else
    class="font-code break-words whitespace-pre-wrap"><code>{{ text }}</code></pre>
</template>
