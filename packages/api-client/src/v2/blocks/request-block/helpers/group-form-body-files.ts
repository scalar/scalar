import { isFileSchema } from '@scalar/workspace-store/helpers/is-file-schema'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

import type { TableRow } from '../components/RequestTableRow.vue'

/** A visible field with the source rows used to serialize its multipart parts. */
export type FormBodyField = {
  data: TableRow
  sourceIndices: number[]
}

/** Group uploaded files for array fields without changing stored values or multipart serialization. */
export const groupFormBodyFiles = (rows: TableRow[]): FormBodyField[] => {
  const fields: FormBodyField[] = []
  const fileFields = new Map<string, FormBodyField>()

  rows.forEach((row, index) => {
    const isFileArray = row.schema && isArraySchema(row.schema) && isFileSchema(row.schema, true, row.contentType)
    // Preserve editable example values, such as variable expressions, until files are selected.
    const canGroup = row.value instanceof File || row.value === '' || row.value === '[]' || row.value === null
    if (!isFileArray || !canGroup) {
      fields.push({ data: row, sourceIndices: [index] })
      return
    }

    const field: FormBodyField = fileFields.get(row.name) ?? { data: { ...row, files: [] }, sourceIndices: [] }
    if (!fileFields.has(row.name)) {
      fields.push(field)
      fileFields.set(row.name, field)
    }
    field.sourceIndices.push(index)
    if (row.value instanceof File) {
      field.data.files?.push({ file: row.value, index, isDisabled: row.isDisabled ?? false })
      field.data.isDisabled = field.data.files?.every((file) => file.isDisabled) ?? false
    }
  })

  return fields
}
