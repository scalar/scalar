import { isObject } from '@scalar/helpers/object/is-object'
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'
import {
  type LeafRow,
  collectExampleRows,
  collectLeafProperties,
  stringifyValue,
} from '@/v2/blocks/request-block/helpers/get-form-body-rows'

/**
 * Build form-table rows for a structured (JSON/YAML) request body.
 *
 * The parsed body value is walked alongside the schema exactly like the multipart form
 * editor does: schema-declared properties first in schema order (nested objects flatten
 * into dotted-path leaves like `props.name`), example-only keys after in example order.
 * Each row is enriched with its leaf schema so the table shows enum dropdowns, required
 * badges, defaults, and validation per field.
 */
export const getStructuredBodyRows = (parsedValue: unknown, schema?: SchemaObject): TableRow[] => {
  const objectSchema = schema && isObjectSchema(schema) ? schema : undefined

  // Nothing to build rows from: neither a body object nor an object schema.
  if (!isObject(parsedValue) && !objectSchema) {
    return []
  }

  // Leaf index by dotted name so nested leaves keep their schema and required flag.
  const leafByDottedName = new Map<string, LeafRow>()
  if (objectSchema) {
    for (const leaf of collectLeafProperties(objectSchema)) {
      leafByDottedName.set(leaf.path.join('.'), leaf)
    }
  }
  const requiredSet = new Set(objectSchema?.required ?? [])

  return collectExampleRows(isObject(parsedValue) ? parsedValue : {}, objectSchema).map(({ path, value }) => {
    const name = path.join('.')

    // Missing values and explicit `null` render as empty inputs so the user can type a
    // value rather than seeing the string "null". Empty rows are omitted on fold-back.
    const rendered = value === undefined || value === null ? '' : stringifyValue(value)

    const row: TableRow = { name, value: rendered, isDisabled: false }

    const leaf = leafByDottedName.get(name)
    const propSchema = leaf?.schema ?? (objectSchema ? resolve.schema(objectSchema.properties?.[name]) : undefined)
    row.schema = propSchema
    row.description = propSchema?.description
    row.isRequired = leaf?.isRequired ?? requiredSet.has(name)

    return row
  })
}
