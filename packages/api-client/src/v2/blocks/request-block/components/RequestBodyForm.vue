<script setup lang="ts">
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import { isFileSchema } from '@scalar/workspace-store/helpers/is-file-schema'
import { resolveFormSchema } from '@scalar/workspace-store/helpers/resolve-form-schema'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  ExampleObject,
  MediaTypeObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed, ref, watch } from 'vue'

import { useFileDialog } from '@/hooks/use-file-dialog'
import RequestTable from '@/v2/blocks/request-block/components/RequestTable.vue'
import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'
import {
  getFormBodyRows,
  getFormBodyValue,
} from '@/v2/blocks/request-block/helpers/get-form-body-rows'

const {
  example,
  bodySchema,
  encoding,
  selectedContentType,
  environment,
  compositionSelection,
} = defineProps<{
  example: ExampleObject | undefined | null
  /** Resolved schema for the form body so the table can show enums and validation per field */
  bodySchema?: SchemaObject
  /** Encoding overrides for individual multipart fields. */
  encoding?: MediaTypeObject['encoding']
  /** Selected request-body variants, shared with example generation and serialization. */
  compositionSelection?: Record<string, number>
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
  () =>
    [
      example,
      bodySchema,
      selectedContentType,
      compositionSelection,
      encoding,
    ] as const,
  ([newExample, schema, contentType, selection, fieldEncoding]) => {
    localFormBodyRows.value = getFormBodyRows(
      newExample,
      contentType,
      schema,
      selection,
      fieldEncoding,
    )
  },
  { immediate: true },
)

/** Undeclared fields follow additionalProperties instead of losing uploads whenever a schema exists. */
const allowUnknownFileUploads = computed<boolean>(() => {
  const schema = resolveFormSchema(bodySchema, compositionSelection)
  const additional =
    schema && 'additionalProperties' in schema
      ? schema.additionalProperties
      : undefined
  return typeof additional === 'object'
    ? isFileSchema(resolveFormSchema(additional) ?? { __scalar_: '' })
    : additional !== false
})

const handleUpdateFormValue = (rows: TableRow[]) => {
  emit(
    'update:formValue',
    rows.map((row) => ({
      name: row.name,
      value:
        selectedContentType === 'multipart/form-data'
          ? getFormBodyValue(row)
          : (row.value as string | File),
      isDisabled: row.isDisabled ?? false,
      ...(row.isDisabledByDefault ? { isDisabledByDefault: true } : {}),
      ...(selectedContentType === 'multipart/form-data' && row.isArray
        ? { isArray: true }
        : {}),
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

  localFormBodyRows.value = localFormBodyRows.value.map((row, i) => {
    if (i !== index) {
      return row
    }

    const valueChanged = 'value' in payload && payload.value !== row.value
    const disabledChanged =
      payload.isDisabled !== undefined && payload.isDisabled !== row.isDisabled

    return {
      ...row,
      ...payload,
      // File selection bypasses the text input, but also expresses intent to send a value.
      ...(valueChanged && payload.value !== undefined && row.isDisabledByDefault
        ? { isDisabled: false }
        : {}),
      // Preserve untouched defaults while keeping deliberate checkbox choices explicit.
      isDisabledByDefault:
        row.isDisabledByDefault && !valueChanged && !disabledChanged,
    }
  })
  handleUpdateFormValue(localFormBodyRows.value)
}

/** Delete a row from the table */
const handleDeleteRow = (index: number) => {
  localFormBodyRows.value = localFormBodyRows.value.filter(
    (_, i) => i !== index,
  )
  handleUpdateFormValue(localFormBodyRows.value)
}

/** Handle file upload for a specific row index */
const handleFileUpload = (index: number) => {
  const { open } = useFileDialog({
    onChange: (files) => {
      const file = files?.[0]

      if (file) {
        const currentRow = localFormBodyRows.value[index]
        handleUpsertRow(index, {
          name: currentRow?.name || file.name,
          value: file,
        })
      }
    },
    multiple: false,
    accept: '*/*',
  })
  void open()
}
</script>

<template>
  <!-- Form Data -->
  <template v-if="selectedContentType === 'multipart/form-data'">
    <RequestTable
      :allowUnknownFileUploads="allowUnknownFileUploads"
      :data="localFormBodyRows"
      deferKeyUpdates
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
      deferKeyUpdates
      :environment="environment"
      @deleteRow="handleDeleteRow"
      @upsertRow="handleUpsertRow" />
  </template>
</template>
