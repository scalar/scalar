<script setup lang="ts">
import { getResolvedRefDeep } from '@scalar/api-client/blocks/operation-code-sample'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { ScalarCodeBlockCopy } from '@scalar/components/code-block'
import { ScalarVirtualText } from '@scalar/components/virtual-text'
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
  <div
    v-else
    class="scalar-code-block group/code-block relative bg-b-2 min-h-0 min-w-0">
    <ScalarVirtualText
      :id="id"
      containerClass="custom-scroll border rounded-b flex flex-1 max-h-screen"
      contentClass="language-plaintext whitespace-pre font-code text-base p-2"
      :lineHeight="20"
      :text="schemaContent ?? ''" />
    <ScalarCodeBlockCopy
      class="scalar-code-copy absolute top-2.5 right-2.5 opacity-0 group-hocus-within/code-block:opacity-100"
      :content="schemaContent ?? ''"
      :showLang="true"
      lang="json" />
  </div>
</template>
