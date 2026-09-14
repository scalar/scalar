<script setup lang="ts">
import { getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.2/strict/example'
import { computed } from 'vue'

const {
  xml = false,
  modelValue,
  schema,
  example,
  mode,
  openapiVersion,
} = defineProps<{
  xml?: boolean
  modelValue?: unknown
  schema?: unknown
  example?: ExampleObject
  mode?: 'read' | 'write'
  openapiVersion?: string
}>()

const xmlContent = computed(() =>
  getXmlBodyExample(
    schema && typeof schema === 'object' ? (schema as SchemaObject) : undefined,
    example,
    { mode, openapiVersion },
  ),
)
</script>
<template>
  <template v-if="xml">
    <pre
      v-if="
        xmlContent.xml !== undefined
      "><code class="language-xml">{{ xmlContent.xml }}</code></pre>
    <p v-else>Unable to generate an XML example.</p>
  </template>
  <template v-else>
    <pre><code class="language-json">{{ JSON.stringify(modelValue, null, 2) }}</code></pre>
  </template>
</template>
