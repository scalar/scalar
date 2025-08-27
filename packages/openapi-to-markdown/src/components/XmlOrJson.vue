<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
// @ts-expect-error Doesn't come with types
import objectToXML from 'object-to-xml'

withDefaults(
  defineProps<{
    xml?: boolean
    modelValue: OpenAPIV3_1.SchemaObject
  }>(),
  {
    xml: false,
  },
)
</script>
<template>
  <template v-if="xml">
    <pre><code>{{ `<?xml version="1.0" encoding="UTF-8"?>${objectToXML(modelValue)}` }}</code></pre>
  </template>
  <template v-else>
    <pre><code>{{ JSON.stringify(modelValue, null, 2) }}</code></pre>
  </template>
</template>
