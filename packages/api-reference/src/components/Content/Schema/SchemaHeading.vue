<script lang="ts" setup>
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import { computed } from 'vue'

import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'

const { value } = defineProps<{
  value: SchemaObject
  name?: string
}>()

/** Generate a failsafe type from the properties when we don't have one */
const failsafeType = computed(() => {
  if ('type' in value) {
    return value.type
  }

  if (value.enum) {
    return 'enum'
  }

  if (isArraySchema(value) && value.items) {
    return 'array'
  }

  if (isTypeObject(value) && (value.properties || value.additionalProperties)) {
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
        'type' in value && typeof value.type === 'string'
          ? value.type
          : 'type' in value && Array.isArray(value.type)
            ? value.type.join(' | ')
            : 'unknown type'
      ">
      <template v-if="isTypeObject(value)"> {} </template>
      <template v-if="isArraySchema(value)"> [] </template>
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
