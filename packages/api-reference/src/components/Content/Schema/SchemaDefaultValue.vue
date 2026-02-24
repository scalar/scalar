<script lang="ts" setup>
import { computed } from 'vue'

import SchemaPropertyDetail from '@/components/Content/Schema/SchemaPropertyDetail.vue'

const { value } = defineProps<{
  value: unknown
}>()

/**
 * Flattens value values for display purposes.
 */
const formattedDefault = computed(() => {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value) && value.length === 1) {
    return String(value[0])
  }

  if (typeof value === 'string') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value)
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return value
})
</script>

<template>
  <SchemaPropertyDetail
    v-if="formattedDefault !== undefined"
    truncate>
    <template #prefix>default:</template>{{ formattedDefault }}
  </SchemaPropertyDetail>
</template>
