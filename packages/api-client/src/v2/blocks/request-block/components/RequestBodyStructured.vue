<script setup lang="ts">
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, watch } from 'vue'

import RequestTable from '@/v2/blocks/request-block/components/RequestTable.vue'
import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'
import { foldStructuredBodyRows } from '@/v2/blocks/request-block/helpers/fold-structured-body-rows'
import { getStructuredBodyRows } from '@/v2/blocks/request-block/helpers/get-structured-body-rows'
import { getStructuredBodyCodec } from '@/v2/blocks/request-block/helpers/structured-body-codec'

const { parsedValue, bodySchema, contentType, environment } = defineProps<{
  /** The parsed (object) value of the structured body */
  parsedValue: unknown
  /** Resolved schema for the body so the table can show enums and validation per field */
  bodySchema?: SchemaObject
  /** The selected content type, decides how the folded body is serialized (JSON/YAML) */
  contentType: string
  environment: XScalarEnvironment
}>()

const emit = defineEmits<{
  /** Serialized body text for the current content type */
  (e: 'update:value', payload: string): void
}>()

const codec = computed(() => getStructuredBodyCodec(contentType))

/** Local state for the body rows */
const localRows = ref<TableRow[]>([])

/**
 * The serialized string we last emitted. Store updates triggered by our own emit come
 * back through the `parsedValue` prop — skip the row rebuild for those so typing does
 * not churn focus and a just-cleared row does not vanish mid-edit.
 */
let lastEmitted: string | undefined

watch(
  () => [parsedValue, bodySchema, contentType] as const,
  ([newValue, schema]) => {
    if (lastEmitted !== undefined && codec.value) {
      try {
        if (codec.value.stringify(newValue) === lastEmitted) {
          return
        }
      } catch {
        // Not serializable — treat as an external change and rebuild.
      }
    }
    lastEmitted = undefined
    localRows.value = getStructuredBodyRows(newValue, schema)
  },
  { immediate: true },
)

const emitRows = () => {
  if (!codec.value) {
    return
  }
  const serialized = codec.value.stringify(
    foldStructuredBodyRows(localRows.value, bodySchema),
  )
  lastEmitted = serialized
  emit('update:value', serialized)
}

/** Update a row in the table, combines with the previous data so we emit the whole body */
const handleUpsertRow = (
  index: number,
  payload: Partial<{
    name: string
    value: string | File | undefined
    isDisabled: boolean
  }>,
) => {
  // Add new row
  if (index >= localRows.value.length) {
    localRows.value = [
      ...localRows.value,
      { name: '', value: '', ...payload, isDisabled: false },
    ]
    emitRows()
    return
  }

  localRows.value = localRows.value.map((row, i) =>
    i === index ? { ...row, ...payload } : row,
  )
  emitRows()
}

/** Delete a row from the table */
const handleDeleteRow = (index: number) => {
  localRows.value = localRows.value.filter((_, i) => i !== index)
  emitRows()
}
</script>

<template>
  <RequestTable
    :data="localRows"
    :environment="environment"
    label="Body"
    @deleteRow="handleDeleteRow"
    @upsertRow="handleUpsertRow" />
</template>
