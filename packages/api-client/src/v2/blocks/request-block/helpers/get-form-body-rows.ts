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
  }: {
    name: string
    value: string | File
    isDisabled?: boolean
  }): TableRow => {
    const row: TableRow = { name, value, isDisabled }
    if (!schemaWithProperties || !name) {
      return row
    }
    const propSchema = resolve.schema(schemaWithProperties.properties?.[name])
    row.schema = propSchema
    row.description = propSchema?.description
    row.isRequired = requiredSet?.has(name)
    row.isDisabled = isDisabled
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

  // We got an object try to convert it to an array of rows
  if (typeof example.value === 'object' && example.value) {
    return objectEntries(example.value).map(([key, value]) =>
      mapRow({ name: String(key), value: stringifyValue(value) }),
    )
  }

  return []
}
