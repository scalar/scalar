<script lang="ts" setup>
import type { OpenAPIV2 } from '@scalar/openapi-parser'

defineProps<{
  value: OpenAPIV2.SchemaObject
  name?: string
}>()
</script>
<template>
  <span class="schema-type">
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
    <template v-if="value?.xml?.name && value?.xml?.name !== '##default'">
      &lt;{{ value?.xml?.name }} /&gt;
    </template>
    <template v-else-if="name">
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
}
.schema-type {
  font-family: var(--scalar-font-code);
}
</style>
