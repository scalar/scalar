import { isFileSchema } from '@scalar/workspace-store/helpers/is-file-schema'
import { resolveSchemaWithAnnotations } from '@scalar/workspace-store/helpers/resolve-schema-with-annotations'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/schema'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

import type { TableRow } from '../components/RequestTableRow.vue'

/** A visible field with the source rows used to serialize its multipart parts. */
export type FormBodyField = {
  data: TableRow
  sourceIndices: number[]
}

/** Empty fields must keep text editing unless every non-null alternative requires a file. */
const requiresFile = (
  input: MaybeRefSchemaObject | boolean | undefined,
  contentType?: string,
  ancestors = new Set<MaybeRefSchemaObject>(),
): boolean => {
  if (typeof input === 'boolean' || !input || ancestors.has(input)) {
    return false
  }
  const schema: SchemaObject | undefined = resolveSchemaWithAnnotations(input)
  if (!schema || !isFileSchema(schema, false, contentType)) {
    return false
  }
  const seen = new Set([...ancestors, input])
  if ('type' in schema || ('format' in schema && schema.format === 'binary')) {
    return true
  }
  const alternatives = schema.oneOf ?? schema.anyOf
  if (alternatives?.length) {
    return alternatives.every((member) => {
      const resolved = resolveSchemaWithAnnotations(member)
      return (resolved && 'type' in resolved && resolved.type === 'null') || requiresFile(member, contentType, seen)
    })
  }
  if (schema.allOf?.length) {
    return schema.allOf.some((member) => requiresFile(member, contentType, seen))
  }
  return true
}

/** Group uploaded files for array fields without changing stored values or multipart serialization. */
export const groupFormBodyFiles = (rows: TableRow[]): FormBodyField[] => {
  const fields: FormBodyField[] = []
  const fileFields = new Map<string, FormBodyField>()

  rows.forEach((row, index) => {
    const isFileArray =
      row.schema &&
      isArraySchema(row.schema) &&
      (row.value instanceof File || requiresFile(row.schema.items, row.contentType))
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
