<script setup lang="ts">
import { json2xml } from '@scalar/helpers/file/json2xml'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

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
    <pre><code>{{ json2xml(modelValue) }}</code></pre>
  </template>
  <template v-else>
    <pre><code>{{ JSON.stringify(modelValue, null, 2) }}</code></pre>
  </template>
</template>
