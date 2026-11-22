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
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'
import { computed, ref, watch } from 'vue'

import { useFileDialog } from '@/hooks/use-file-dialog'
import RequestTable from '@/v2/blocks/request-block/components/RequestTable.vue'
import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'
import {
  getFormBodyRows,
  getFormBodyValue,
} from '@/v2/blocks/request-block/helpers/get-form-body-rows'
import { groupFormBodyFiles } from '@/v2/blocks/request-block/helpers/group-form-body-files'

const {
  example,
  bodySchema,
  encoding,
  aspNetFormNaming,
  selectedContentType,
  environment,
  compositionSelection,
} = defineProps<{
  example: ExampleObject | undefined | null
  /** Resolved schema for the form body so the table can show enums and validation per field */
  bodySchema?: SchemaObject
  /** Encoding overrides for individual multipart fields. */
  encoding?: MediaTypeObject['encoding']
  aspNetFormNaming?: boolean
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

const formFields = computed(() =>
  selectedContentType === 'multipart/form-data'
    ? groupFormBodyFiles(localFormBodyRows.value)
    : localFormBodyRows.value.map((data, index) => ({
        data,
        sourceIndices: [index],
      })),
)
const displayedRows = computed<TableRow[]>(() =>
  formFields.value.map((field) => field.data),
)

/** Sync the local form body rows with the example and schema */
watch(
  () =>
    [
      example,
      bodySchema,
      selectedContentType,
      compositionSelection,
      encoding,
      aspNetFormNaming,
    ] as const,
  ([
    newExample,
    schema,
    contentType,
    selection,
    fieldEncoding,
    aspNetNaming,
  ]) => {
    localFormBodyRows.value = getFormBodyRows(
      newExample,
      contentType,
      schema,
      selection,
      fieldEncoding,
      aspNetNaming,
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

const handleUpdateFormValue = (rows: TableRow[]): void => {
  emit(
    'update:formValue',
    rows.map((row) => ({
      name: row.name,
      value:
        selectedContentType === 'multipart/form-data' || aspNetFormNaming
          ? getFormBodyValue(row)
          : (row.value as string | File),
      isDisabled: row.isDisabled ?? false,
      ...(row.isDisabledByDefault ? { isDisabledByDefault: true } : {}),
      ...((selectedContentType === 'multipart/form-data' || aspNetFormNaming) &&
      row.isArray
        ? { isArray: true }
        : {}),
    })),
  )
}

/** Update a row in the table, combines with the previous data so we emit a whole row */
const handleUpsertRow = (
  index: number | number[],
  payload: Partial<{
    name: string
    value: string | File | undefined
    isDisabled: boolean
  }>,
): void => {
  const indices = Array.isArray(index) ? index : [index]
  // Add new row
  if (
    indices[0] !== undefined &&
    indices[0] >= localFormBodyRows.value.length
  ) {
    localFormBodyRows.value = [
      ...localFormBodyRows.value,
      { name: '', value: '', ...payload, isDisabled: false },
    ]
    handleUpdateFormValue(localFormBodyRows.value)
    return
  }

  localFormBodyRows.value = localFormBodyRows.value.map((row, i) => {
    if (!indices.includes(i)) {
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

/** Remember individual choices while the whole file field is temporarily disabled. */
const disabledFileChoices = new WeakMap<File, boolean>()

/** Apply field edits to all its parts without replacing sibling files with the first file. */
const handleFieldUpsert = (
  index: number,
  payload: Parameters<typeof handleUpsertRow>[1],
): void => {
  const field = formFields.value[index]
  if (
    field?.data.files?.length &&
    payload.isDisabled !== undefined &&
    payload.isDisabled !== field.data.isDisabled
  ) {
    localFormBodyRows.value = localFormBodyRows.value.map((row, i) => {
      if (!field.sourceIndices.includes(i) || !(row.value instanceof File)) {
        return row
      }
      if (payload.isDisabled) {
        disabledFileChoices.set(row.value, row.isDisabled ?? false)
      }
      const isDisabled =
        payload.isDisabled || (disabledFileChoices.get(row.value) ?? false)
      if (!payload.isDisabled) {
        disabledFileChoices.delete(row.value)
      }
      return { ...row, isDisabled, isDisabledByDefault: false }
    })
    handleUpdateFormValue(localFormBodyRows.value)
    return
  }
  handleUpsertRow(
    field?.sourceIndices ?? localFormBodyRows.value.length,
    field?.data.files
      ? {
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.isDisabled !== undefined &&
          payload.isDisabled !== field.data.isDisabled
            ? { isDisabled: payload.isDisabled }
            : {}),
        }
      : payload,
  )
}

/** Delete a row from the table */
const handleDeleteRow = (index: number): void => {
  const indices = formFields.value[index]?.sourceIndices ?? [index]
  localFormBodyRows.value = localFormBodyRows.value.filter(
    (_, i) => !indices.includes(i),
  )
  handleUpdateFormValue(localFormBodyRows.value)
}

/** Remove a selected file, retaining one empty field after the last file is removed. */
const handleRemoveFile = (index: number, fileIndex?: number): void => {
  const field = formFields.value[index]
  const sourceIndex = fileIndex ?? field?.sourceIndices[0] ?? index
  if (field?.data.files) {
    const remaining = localFormBodyRows.value.filter(
      (row, i) =>
        field.sourceIndices.includes(i) &&
        i !== sourceIndex &&
        row.value instanceof File,
    )
    const original = localFormBodyRows.value[sourceIndex]
    if (!original) {
      return
    }
    const replacement = remaining.length
      ? remaining
      : [{ ...original, value: '[]', isArray: true }]
    localFormBodyRows.value = localFormBodyRows.value.flatMap((row, i) => {
      if (i === field.sourceIndices[0]) {
        return replacement
      }
      return field.sourceIndices.includes(i) ? [] : [row]
    })
    handleUpdateFormValue(localFormBodyRows.value)
    return
  }
  handleUpsertRow(sourceIndex, { value: undefined })
}

/** Handle file upload for a specific row index */
const handleFileUpload = (index: number): void => {
  const field = formFields.value[index]
  const sourceIndices = field?.sourceIndices ?? [localFormBodyRows.value.length]
  const sourceIndex = sourceIndices[0] ?? localFormBodyRows.value.length
  const currentRow = localFormBodyRows.value[sourceIndex]
  // Array fields accept multiple files, serialized as separate multipart parts under the same name.
  const allowMultiple = Boolean(
    currentRow?.schema && isArraySchema(currentRow.schema),
  )

  const { open } = useFileDialog({
    onChange: (files) => {
      const selected = files ? Array.from(files) : []
      if (selected.length === 0) {
        return
      }

      // Every selected file shares the field key, falling back to the first file name when
      // the row has no name yet (e.g. schema-less requests).
      const fieldName = currentRow?.name || selected[0]?.name || ''

      // Keep a selection together beside its field, and emit once so consumers never
      // observe a partially applied selection.
      const selectedRows: TableRow[] = selected.map((file) => ({
        ...currentRow,
        name: fieldName,
        value: file,
        // Selecting files enables untouched optional fields while preserving explicit choices.
        isDisabled: field?.data.isDisabledByDefault
          ? false
          : (field?.data.isDisabled ?? false),
        isDisabledByDefault: false,
      }))
      const existingFiles = field?.data.files
        ? localFormBodyRows.value.filter(
            (row, i) => sourceIndices.includes(i) && row.value instanceof File,
          )
        : []
      const remaining = localFormBodyRows.value.filter(
        (_, i) => !sourceIndices.includes(i),
      )
      localFormBodyRows.value = [
        ...remaining.slice(0, sourceIndex),
        ...existingFiles,
        ...selectedRows,
        ...remaining.slice(sourceIndex),
      ]
      handleUpdateFormValue(localFormBodyRows.value)
    },
    multiple: allowMultiple,
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
      :data="displayedRows"
      deferKeyUpdates
      :environment="environment"
      showUploadButton
      @deleteRow="handleDeleteRow"
      @removeFile="handleRemoveFile"
      @updateFile="
        (index, disabled) => handleUpsertRow(index, { isDisabled: disabled })
      "
      @uploadFile="handleFileUpload"
      @upsertRow="handleFieldUpsert" />
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
