<script setup lang="ts">
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import ParameterListItem from './ParameterListItem.vue'

withDefaults(
  defineProps<{
    parameters?: RequestEntity['parameters'] | RequestEntity['responses']
    showChildren?: boolean
    collapsableItems?: boolean
    withExamples?: boolean
    schemas?: Record<string, OpenAPIV3_1.SchemaObject> | unknown
  }>(),
  {
    showChildren: false,
    collapsableItems: false,
    withExamples: true,
  },
)
</script>
<template>
  <div
    v-if="parameters?.length"
    class="parameter-list">
    <div class="parameter-list-title">
      <slot name="title" />
    </div>
    <ul class="parameter-list-items">
      <ParameterListItem
        v-for="item in parameters"
        :key="item.name"
        :collapsableItems="collapsableItems"
        :parameter="item"
        :schemas="schemas"
        :showChildren="showChildren"
        :withExamples="withExamples" />
    </ul>
  </div>
</template>

<style scoped>
.parameter-list {
  margin-top: 24px;
}
.parameter-list-title {
  font-size: var(--scalar-font-size-2);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  line-height: 1.45;
  margin-top: 12px;
  margin-bottom: 12px;
}

.parameter-list-items {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: var(--scalar-small);
  margin-bottom: 12px;
}
</style>
