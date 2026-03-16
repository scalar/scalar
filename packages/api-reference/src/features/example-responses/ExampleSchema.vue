<script setup lang="ts">
import { getResolvedRefDeep } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { ScalarCodeBlock, ScalarVirtualText } from '@scalar/components'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import type { ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/reference'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { computed } from 'vue'

const { id, schema } = defineProps<{
  id: string
  schema: ReferenceType<SchemaObject>
}>()

const schemaContent = computed(() => {
  if (!schema) {
    return undefined
  }

  return prettyPrintJson(getResolvedRefDeep(schema))
})

const VIRTUALIZATION_THRESHOLD = 20_000

const shouldVirtualizeSchema = computed(() => {
  return (schemaContent.value?.length ?? 0) > VIRTUALIZATION_THRESHOLD
})
</script>

<template>
  <ScalarCodeBlock
    v-if="!shouldVirtualizeSchema"
    :id="id"
    class="bg-b-2"
    lang="json"
    :prettyPrintedContent="schemaContent ?? ''" />
  <ScalarVirtualText
    v-else
    :id="id"
    containerClass="custom-scroll scalar-code-block border rounded-b flex flex-1 max-h-screen"
    contentClass="language-plaintext whitespace-pre font-code text-base"
    :lineHeight="20"
    :text="schemaContent ?? ''" />
</template>
