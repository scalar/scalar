import { setValueAtPath } from '@scalar/helpers/object/set-value-at-path'
import {
  buildDottedNestedRowPredicate,
  coerceLeafValueToSchemaType,
  coerceUntypedValue,
  resolveLeafSchema,
} from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'

/**
 * Fold form-table rows back into the structured body object.
 *
 * Inverse of `getStructuredBodyRows`: dotted names fold into nested objects only when
 * the schema declares the top segment as a nested object (same predicate the multipart
 * builder uses), so a user-typed literal key like `user.email` on an undeclared prefix
 * stays flat. Values come back from the table as strings and are restored to their
 * schema-declared type; undeclared leaves get best-effort JSON coercion so untouched
 * numbers/booleans survive a form round-trip.
 *
 * Disabled rows and empty values are omitted — leaving a field empty is how a user
 * drops an optional property from the body.
 */
export const foldStructuredBodyRows = (rows: TableRow[], schema?: SchemaObject): Record<string, unknown> => {
  const isDottedNestedRow = buildDottedNestedRowPredicate(schema)
  const result: Record<string, unknown> = {}

  for (const row of rows) {
    if (row.isDisabled || !row.name) {
      continue
    }
    const value = row.value
    if (typeof value !== 'string' || value === '') {
      continue
    }

    const segments = isDottedNestedRow(row.name, value) ? row.name.split('.') : [row.name]
    const leafSchema = resolveLeafSchema(schema, segments)

    // A leaf schema without a declared type gives no signal to keep `"5"` a string, so
    // fall back to best-effort coercion — same as fully undeclared keys.
    const hasDeclaredType = leafSchema && 'type' in leafSchema && leafSchema.type != null
    const coerced = hasDeclaredType ? coerceLeafValueToSchemaType(value, leafSchema) : coerceUntypedValue(value)

    setValueAtPath(result, segments, coerced)
  }

  return result
}
