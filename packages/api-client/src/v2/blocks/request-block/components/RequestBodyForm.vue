<script setup lang="ts">
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  ExampleObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { ref, watch } from 'vue'

import { useFileDialog } from '@/hooks/use-file-dialog'
import RequestTable from '@/v2/blocks/request-block/components/RequestTable.vue'
import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'
import { getFormBodyRows } from '@/v2/blocks/request-block/helpers/get-form-body-rows'

const { example, bodySchema, selectedContentType, environment } = defineProps<{
  example: ExampleObject | undefined | null
  /** Resolved schema for the form body so the table can show enums and validation per field */
  bodySchema?: SchemaObject
  selectedContentType: string
  environment: XScalarEnvironment
}>()

const emit = defineEmits<{
  (
    e: 'update:formValue',
    payload: ApiReferenceEvents['operation:update:requestBody:formValue']['payload'],
  ): void
}>()

/** Local state for form body rows */
const localFormBodyRows = ref<TableRow[]>([])

/** Sync the local form body rows with the example and schema */
watch(
  () => [example, bodySchema, selectedContentType] as const,
  ([newExample, schema, contentType]) => {
    localFormBodyRows.value = getFormBodyRows(newExample, contentType, schema)
  },
  { immediate: true },
)

const handleUpdateFormValue = (rows: TableRow[]) => {
  emit(
    'update:formValue',
    rows.map((row) => ({
      name: row.name,
      value: row.value as string | File,
      isDisabled: row.isDisabled ?? false,
    })),
  )
}

/** Update a row in the table, combines with the previous data so we emit a whole row */
const handleUpsertRow = (
  index: number,
  payload: Partial<{
    name: string
    value: string | File | undefined
    isDisabled: boolean
  }>,
) => {
  // Add new row
  if (index >= localFormBodyRows.value.length) {
    localFormBodyRows.value = [
      ...localFormBodyRows.value,
      { name: '', value: '', ...payload, isDisabled: false },
    ]
    handleUpdateFormValue(localFormBodyRows.value)
    return
  }

  localFormBodyRows.value = localFormBodyRows.value.map((row, i) =>
    i === index ? { ...row, ...payload } : row,
  )
  handleUpdateFormValue(localFormBodyRows.value)
}

/** Delete a row from the table */
const handleDeleteRow = (index: number) => {
  localFormBodyRows.value = localFormBodyRows.value.filter(
    (_, i) => i !== index,
  )
  handleUpdateFormValue(localFormBodyRows.value)
}

/** True when the row's schema declares an array-typed property (e.g. `files: string[]`). */
const isArrayField = (row: TableRow | undefined): boolean => {
  const type = row?.schema && 'type' in row.schema ? row.schema.type : undefined
  return Array.isArray(type) ? type.includes('array') : type === 'array'
}

/** Handle file upload for a specific row index */
const handleFileUpload = (index: number) => {
  const currentRow = localFormBodyRows.value[index]
  // Array-typed fields (e.g. `files: string[]`) accept several files in a single pick, like
  // Postman. Other fields stay single-file so an existing value is not silently replaced.
  const allowMultiple = isArrayField(currentRow)

  const { open } = useFileDialog({
    onChange: (files) => {
      const selected = files ? Array.from(files) : []
      if (selected.length === 0) {
        return
      }

      // Every selected file shares the field key, falling back to the first file name when
      // the row has no name yet (e.g. schema-less requests).
      const fieldName = currentRow?.name || selected[0]?.name || ''

      // The first file fills the clicked row (handleUpsertRow appends if it is the new-row
      // slot); any extras become additional rows reusing the same name, so the request sends
      // one part per file (`files=@a`, `files=@b`) — the array/multipart wire shape.
      handleUpsertRow(index, { name: fieldName, value: selected[0]! })

      if (selected.length > 1) {
        const extraRows: TableRow[] = selected.slice(1).map((file) => ({
          name: fieldName,
          value: file,
          isDisabled: false,
        }))
        localFormBodyRows.value = [...localFormBodyRows.value, ...extraRows]
        handleUpdateFormValue(localFormBodyRows.value)
      }
    },
    multiple: allowMultiple,
    accept: '*/*',
  })
  open()
}
</script>

<template>
  <!-- Form Data -->
  <template v-if="selectedContentType === 'multipart/form-data'">
    <RequestTable
      :data="localFormBodyRows"
      :environment="environment"
      showUploadButton
      @deleteRow="handleDeleteRow"
      @removeFile="(index) => handleUpsertRow(index, { value: undefined })"
      @uploadFile="handleFileUpload"
      @upsertRow="handleUpsertRow" />
  </template>

  <!-- Form URL Encoded -->
  <template v-else>
    <RequestTable
      :data="localFormBodyRows"
      :environment="environment"
      @deleteRow="handleDeleteRow"
      @upsertRow="handleUpsertRow" />
  </template>
</template>
