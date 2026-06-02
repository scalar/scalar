<script setup lang="ts">
import { getResolvedRefDeep } from '@scalar/api-client/blocks/operation-code-sample'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { ScalarVirtualCodeBlock } from '@scalar/components/virtual-code-block'
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
  <ScalarVirtualCodeBlock
    v-else
    :id="id"
    class="bg-b-2"
    :content="schemaContent ?? ''"
    lang="json" />
</template>
