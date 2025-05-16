<script lang="ts" setup>
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  value:
    | OpenAPIV3_1.SchemaObject
    | OpenAPIV3_1.ArraySchemaObject
    | OpenAPIV3_1.NonArraySchemaObject
  name?: string
}>()
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
      {{ value.type }}
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
