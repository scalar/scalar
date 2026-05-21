import { isObject } from '@scalar/helpers/object/is-object'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import { resolve } from '@scalar/workspace-store/resolve'
import type { ExampleObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'

const stringifyValue = (value: unknown) => {
  if (value instanceof File) {
    return value.name
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }
  return String(value)
}

type LeafRow = {
  path: string[]
  schema: SchemaObject | undefined
  isRequired: boolean
}

/**
 * Walk a (possibly nested) object schema and collect one entry per leaf property.
 *
 * A "leaf" is any property whose resolved schema is not an `{ type: 'object' }` schema
 * with named `properties` — i.e. primitives, arrays, files, and `additionalProperties`
 * placeholders all stop the recursion. Object properties recurse, so the widget example
 * (`file` + `props.{name,description,created_at}`) yields four leaves.
 */
const collectLeafProperties = (schema: SchemaObject, parentPath: string[] = [], parentRequired = true): LeafRow[] => {
  // Nothing to walk if this is not an object schema or has no declared properties.
  if (!isObjectSchema(schema) || !schema.properties) {
    return []
  }

  // `required` is a list of property names on *this* schema, so build it once per level.
  const requiredSet = new Set(schema.required ?? [])
  const leaves: LeafRow[] = []

  for (const [key, rawChildSchema] of objectEntries(schema.properties)) {
    const childSchema = resolve.schema(rawChildSchema)
    const path = [...parentPath, String(key)]

    // A leaf is only required when *every* ancestor was also required — a non-required
    // parent makes the whole subtree optional regardless of inner `required` lists.
    const isRequired = parentRequired && requiredSet.has(String(key))

    // Nested objects with named properties recurse so each leaf gets its own row;
    // everything else (primitives, arrays, files, additionalProperties placeholders)
    // is treated as a leaf and stops the descent.
    if (childSchema && isObjectSchema(childSchema) && childSchema.properties) {
      leaves.push(...collectLeafProperties(childSchema, path, isRequired))
    } else {
      leaves.push({ path, schema: childSchema, isRequired })
    }
  }

  return leaves
}

/**
 * Walk a schema + example together and collect one row per leaf, including example-only
 * keys that the schema does not declare. Schema-declared properties come first in schema
 * order; extras present in the example follow in example order at each level.
 *
 * Unlike `collectLeafProperties` (which is schema-only and feeds the dotted-name index),
 * this walker drives what the user actually sees in the form: a row for every leaf the
 * example contains, even when the schema is partial or out of date.
 */
const collectExampleRows = (
  example: unknown,
  schema: SchemaObject | undefined,
  parentPath: string[] = [],
): { path: string[]; value: unknown }[] => {
  const rows: { path: string[]; value: unknown }[] = []
  const exampleEntries = isObject(example) ? objectEntries(example as Record<string, unknown>) : []
  const exampleByKey = new Map<string, unknown>(exampleEntries.map(([key, value]) => [String(key), value]))
  const declaredKeys = new Set<string>()
  const schemaProperties = schema && isObjectSchema(schema) ? (schema.properties ?? {}) : {}

  // Schema-declared properties first, in schema order. Nested object schemas recurse so
  // each leaf gets its own row; otherwise the schema-declared key is a leaf and uses the
  // matching example value (or `undefined` when the example does not provide one).
  for (const [key, rawChildSchema] of objectEntries(schemaProperties)) {
    const keyStr = String(key)
    declaredKeys.add(keyStr)
    const childSchema = resolve.schema(rawChildSchema)
    const path = [...parentPath, keyStr]
    const exampleSubvalue = exampleByKey.get(keyStr)

    if (childSchema && isObjectSchema(childSchema) && childSchema.properties) {
      rows.push(...collectExampleRows(exampleSubvalue, childSchema, path))
    } else {
      rows.push({ path, value: exampleSubvalue })
    }
  }

  // Example-only properties at this level (preserve example order). Their inner shape is
  // not descended into — without a schema saying "this is a nested object" we have no
  // signal to flatten, so an object value becomes a single JSON-stringified row, matching
  // the schema-less fallback below.
  for (const [key, value] of exampleEntries) {
    const keyStr = String(key)
    if (declaredKeys.has(keyStr)) {
      continue
    }
    rows.push({ path: [...parentPath, keyStr], value })
  }

  return rows
}

/** Build the table rows for the form data, optionally enriched with schema (e.g. enum) per property */
export const getFormBodyRows = (
  example: ExampleObject | undefined | null,
  contentType: string,
  formBodySchema?: SchemaObject,
): TableRow[] => {
  // We only need the rows for formData
  if (
    !example?.value ||
    (contentType !== 'multipart/form-data' && contentType !== 'application/x-www-form-urlencoded')
  ) {
    return []
  }

  // Get all the schema properties if the schema is an object schema
  const schemaWithProperties = formBodySchema && isObjectSchema(formBodySchema) ? formBodySchema : undefined
  const requiredSet = schemaWithProperties ? new Set(schemaWithProperties.required ?? []) : undefined

  // Pre-compute the leaf-by-dotted-name index up front so both the array and the
  // schema-driven branches can pull each row's leaf schema and required flag without
  // re-walking the schema. Without this, edited rows lose the per-leaf `Required`
  // badge because a top-level `properties[name]` lookup misses dotted names.
  const leafByDottedName = new Map<string, LeafRow>()
  if (schemaWithProperties) {
    for (const leaf of collectLeafProperties(schemaWithProperties)) {
      leafByDottedName.set(leaf.path.join('.'), leaf)
    }
  }

  const mapRow = ({
    name,
    value,
    isDisabled = false,
  }: {
    name: string
    value: string | File
    isDisabled?: boolean
  }): TableRow => {
    const row: TableRow = { name, value, isDisabled }
    if (!schemaWithProperties || !name) {
      return row
    }
    // Prefer the pre-resolved leaf (handles dotted names like `props.name`); fall back
    // to a top-level property lookup so user-added rows keep working.
    const leaf = leafByDottedName.get(name)
    const propSchema = leaf?.schema ?? resolve.schema(schemaWithProperties.properties?.[name])
    row.schema = propSchema
    row.description = propSchema?.description
    row.isRequired = leaf?.isRequired ?? requiredSet?.has(name) ?? false
    return row
  }

  // We have form data stored as an array
  if (Array.isArray(example.value)) {
    return example.value.map((exampleValue) => {
      if (isObject(exampleValue)) {
        const name = String(exampleValue.name)
        const value = exampleValue.value instanceof File ? exampleValue.value : String(exampleValue.value)
        const isDisabled = Boolean(exampleValue.isDisabled)
        return mapRow({ name, value, isDisabled })
      }
      return { name: '', value: exampleValue, isDisabled: false }
    })
  }

  // Schema-driven path: when the form body schema describes nested objects, emit one row
  // per leaf so users can edit individual fields. The dotted name (`props.name`) is folded
  // back into a single JSON multipart part by `build-request-body.ts` before the request is
  // sent. Gated to `multipart/form-data` because urlencoded has no regrouping step on send,
  // so dotted leaves would otherwise reach the wire as separate `props.name`-style fields.
  //
  // We walk the example alongside the schema so example-only properties (top-level extras
  // or undeclared keys inside a nested object) are still visible and editable instead of
  // being silently dropped to whatever the schema happens to declare.
  if (contentType === 'multipart/form-data' && schemaWithProperties && typeof example.value === 'object') {
    return collectExampleRows(example.value, schemaWithProperties).map(({ path, value }) => {
      // Missing values and explicit `null` (e.g. for a nullable schema) render as empty
      // inputs so the user can type a value rather than seeing the string "null".
      const rendered =
        value instanceof File ? value : value === undefined || value === null ? '' : stringifyValue(value)
      return mapRow({ name: path.join('.'), value: rendered })
    })
  }

  // We got an object try to convert it to an array of rows
  if (typeof example.value === 'object' && example.value) {
    return objectEntries(example.value).map(([key, value]) =>
      mapRow({ name: String(key), value: stringifyValue(value) }),
    )
  }

  return []
}
