import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
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
  // back into a single JSON multipart part by `process-body.ts` before the request is sent.
  if (leafByDottedName.size > 0 && typeof example.value === 'object') {
    return Array.from(leafByDottedName.values()).map(({ path }) => {
      const rawValue = getValueAtPath(example.value, path)
      // Missing values and explicit `null` (e.g. for a nullable schema) render as empty
      // inputs so the user can type a value rather than seeing the string "null".
      const value =
        rawValue instanceof File
          ? rawValue
          : rawValue === undefined || rawValue === null
            ? ''
            : stringifyValue(rawValue)
      return mapRow({ name: path.join('.'), value })
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
