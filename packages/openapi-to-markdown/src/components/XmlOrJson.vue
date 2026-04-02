<script setup lang="ts">
import { json2xml } from '@scalar/helpers/file/json2xml'
import type { MaybeRefSchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

withDefaults(
  defineProps<{
    xml?: boolean
    modelValue: MaybeRefSchemaObject
  }>(),
  {
    xml: false,
  },
)
</script>
<template>
  <template v-if="xml">
    <pre><code class="language-xml">{{ json2xml(modelValue) }}</code></pre>
  </template>
  <template v-else>
    <pre><code class="language-json">{{ JSON.stringify(modelValue, null, 2) }}</code></pre>
  </template>
</template>
