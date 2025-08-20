<script lang="ts" setup>
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { computed } from 'vue'

const { value } = defineProps<{
  value: SchemaObject
  name?: string
}>()

/** Generate a failsafe type from the properties when we don't have one */
const failsafeType = computed(() => {
  if (value.type) {
    return value.type
  }

  if (value.enum) {
    return 'enum'
  }

  if (value.items) {
    return 'array'
  }

  if (value.properties || value.additionalProperties) {
    return 'object'
  }

  return 'unknown'
})
</script>

<template>
  <span
    v-if="typeof value === 'object'"
    class="schema-type">
    <span
      class="schema-type-icon"
      :title="
        typeof value.type === 'string'
          ? value.type
          : Array.isArray(value.type)
            ? value.type.join(' | ')
            : 'unkown type'
      ">
      <template v-if="value.type === 'object'"> {} </template>
      <template v-if="value.type === 'array'"> [] </template>
      <template v-if="value.enum"> enum </template>
    </span>
    <template v-if="name">
      {{ name }}
    </template>
    <template v-else>
      {{ failsafeType }}
    </template>
  </span>
</template>
<style scoped>
/* Style the "icon" */
.schema-type-icon {
  color: var(--scalar-color-1);
  display: none;
}
.schema-type {
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);
}
</style>
