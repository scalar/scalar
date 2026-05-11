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

/** Look up a nested value in the example by walking the path. Returns `undefined` if any segment is missing. */
const getValueAtPath = (root: unknown, path: string[]): unknown => {
  let cursor: unknown = root
  for (const segment of path) {
    if (cursor instanceof File || !isObject(cursor)) {
      return undefined
    }
    cursor = (cursor as Record<string, unknown>)[segment]
  }
  return cursor
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
  if (!isObjectSchema(schema) || !schema.properties) {
    return []
  }
  const requiredSet = new Set(schema.required ?? [])
  const leaves: LeafRow[] = []
  for (const [key, rawChildSchema] of objectEntries(schema.properties)) {
    const childSchema = resolve.schema(rawChildSchema)
    const path = [...parentPath, String(key)]
    const isRequired = parentRequired && requiredSet.has(String(key))
    if (childSchema && isObjectSchema(childSchema) && childSchema.properties) {
      leaves.push(...collectLeafProperties(childSchema, path, isRequired))
    } else {
      leaves.push({ path, schema: childSchema, isRequired })
    }
  }
  return leaves
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

  const mapRow = ({
    name,
    value,
    isDisabled = false,
    leafSchema,
    isRequiredOverride,
  }: {
    name: string
    value: string | File
    isDisabled?: boolean
    leafSchema?: SchemaObject
    isRequiredOverride?: boolean
  }): TableRow => {
    const row: TableRow = { name, value, isDisabled }
    // Recursive walker can supply the resolved leaf schema and required flag directly;
    // for flat inputs we fall back to the top-level property lookup.
    const usingRecursive = leafSchema !== undefined || isRequiredOverride !== undefined
    if (!usingRecursive && (!schemaWithProperties || !name)) {
      return row
    }
    const propSchema = leafSchema ?? resolve.schema(schemaWithProperties?.properties?.[name])
    row.schema = propSchema
    row.description = propSchema?.description
    row.isRequired = isRequiredOverride ?? requiredSet?.has(name) ?? false
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
  // back into a single JSON multipart part by `process-body.ts` before the request is sent.
  if (schemaWithProperties && typeof example.value === 'object') {
    const leaves = collectLeafProperties(schemaWithProperties)
    if (leaves.length > 0) {
      return leaves.map(({ path, schema: leafSchema, isRequired }) => {
        const rawValue = getValueAtPath(example.value, path)
        // Missing values and explicit `null` (e.g. for a nullable schema) render as empty
        // inputs so the user can type a value rather than seeing the string "null".
        const value =
          rawValue instanceof File
            ? rawValue
            : rawValue === undefined || rawValue === null
              ? ''
              : stringifyValue(rawValue)
        return mapRow({
          name: path.join('.'),
          value,
          leafSchema,
          isRequiredOverride: isRequired,
        })
      })
    }
  }

  // We got an object try to convert it to an array of rows
  if (typeof example.value === 'object' && example.value) {
    return objectEntries(example.value).map(([key, value]) =>
      mapRow({ name: String(key), value: stringifyValue(value) }),
    )
  }

  return []
}
