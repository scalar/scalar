<script lang="ts" setup>
import { type OpenAPI, type OpenAPIV2 } from 'openapi-types'

defineProps<{
  value: OpenAPIV2.SchemaObject
  name?: string
}>()
</script>
<template>
  <span class="schema-type">
    <em
      :title="
        typeof value.type === 'string'
          ? value.type
          : Array.isArray(value.type)
          ? value.type.join(' | ')
          : 'unkown type'
      ">
      <template v-if="value.type === 'object'"> {} </template>
      <template v-if="value.type === 'array'"> [] </template>
    </em>
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
.schema-type {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
</style>
