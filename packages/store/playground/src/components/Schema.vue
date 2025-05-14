<script setup lang="ts">
import { ref } from 'vue'

type JsonSchema = {
  type?: string
  properties?: Record<string, JsonSchema>
  [key: string]: any
}

const props = defineProps<{
  schema: JsonSchema
}>()

const isExpanded = ref(false)

const hasProperties =
  typeof props.schema.properties === 'object' &&
  props.schema.properties !== null &&
  !Array.isArray(props.schema.properties)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="border p-4">
    <div class="flex items-center gap-2">
      <h1 class="font-bold">Schema</h1>
      <button
        v-if="hasProperties"
        @click="toggleExpand"
        class="rounded border p-1">
        {{ isExpanded ? 'hide children' : 'show children' }}
      </button>
    </div>

    <pre class="mt-2">{{ schema.type }}</pre>

    <template v-if="isExpanded && hasProperties">
      <div class="mt-2 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
        <Schema
          v-for="(property, key) in Object.entries(schema.properties)"
          :key="key"
          :schema="property[1]" />
      </div>
    </template>
  </div>
</template>
