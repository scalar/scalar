import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { deSerializeParameter, getExample } from '@scalar/workspace-store/request-example'
import type {
  ParameterObject,
  ParameterWithSchemaObject,
  ReferenceType,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import type { TableRow } from '../components/RequestTableRow.vue'
import { getParameterSchema } from './get-parameter-schema'
import { isParamDisabled } from './is-param-disabled'

type ParameterWithRequiredSchema = ParameterWithSchemaObject & {
  schema: ReferenceType<SchemaObject>
}

/** Serialization mode for object-typed query parameters that we expand into multiple rows. */
type ExpansionMode = 'form' | 'deepObject'

const isParameterWithSchema = (parameter: ParameterObject): parameter is ParameterWithRequiredSchema =>
  'schema' in parameter && parameter.schema !== undefined

const resolveSchema = (schema: unknown): SchemaObject | undefined => {
  const resolvedSchema = getResolvedRef(schema as SchemaObject | { '$ref': string; '$ref-value': SchemaObject })

  return resolvedSchema as SchemaObject | undefined
}

/**
 * Resolves the OpenAPI serialization style and explode flag for a parameter, falling back to the
 * spec defaults (style: 'form', explode: true when style is 'form').
 */
const getParameterStyleAndExplode = (parameter: ParameterObject): { style: string; explode: boolean } => {
  const style = 'style' in parameter && parameter.style ? parameter.style : 'form'
  const explode = 'explode' in parameter && parameter.explode !== undefined ? parameter.explode : style === 'form'

  return { style, explode }
}

/**
 * Decides whether an object-typed query parameter should be expanded into one row per property,
 * and which expansion mode to use. Returns null when the parameter should stay as a single row
 * (non-query, non-object schema, or a serialization style we do not expand).
 */
const getExpansionMode = (parameter: ParameterObject, schema: SchemaObject | undefined): ExpansionMode | null => {
  if (parameter.in !== 'query' || !isParameterWithSchema(parameter) || !schema || !isObjectSchema(schema)) {
    return null
  }

  const { style, explode } = getParameterStyleAndExplode(parameter)
  if (!explode) {
    return null
  }

  if (style === 'form') {
    return 'form'
  }
  if (style === 'deepObject') {
    return 'deepObject'
  }

  return null
}

const toTableValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return ''
  }

  if (Array.isArray(value)) {
    return value.join(',')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

const toPathKey = (path: readonly string[]): string => path.join('\u0000')

const toTableRow = ({
  parameter,
  name,
  value,
  description,
  schema,
  isRequired,
  isDisabled,
  sourceParameterValuePath,
}: {
  parameter: ParameterObject
  name: string
  value: unknown
  description: string | undefined
  schema: SchemaObject | undefined
  isRequired: boolean | undefined
  isDisabled: boolean
  sourceParameterValuePath?: string[]
}): TableRow => ({
  name,
  value: toTableValue(value),
  description,
  schema,
  isRequired,
  isDisabled,
  originalParameter: parameter,
  sourceParameterValuePath,
})

/** Build the single-row representation used when a parameter is not expanded. */
const toSingleParameterRow = (
  parameter: ParameterObject,
  schema: SchemaObject | undefined,
  value: unknown,
  isDisabled: boolean,
): TableRow =>
  toTableRow({
    parameter,
    name: parameter.name,
    value,
    description: parameter.description,
    schema,
    isRequired: parameter.required,
    isDisabled,
  })

/**
 * Walks an object schema and produces one row per property.
 *
 * - In `form` mode (the OpenAPI default for query parameters) only the top-level properties are
 *   flattened, and each row is named after the property itself (`status`).
 * - In `deepObject` mode we recurse into nested objects and emit bracketed names that mirror the
 *   serialization on the wire (`filter[user][id]`).
 *
 * `pathPrefix` tracks the path inside the parent parameter value so the handler can later
 * reassemble all sibling rows back into a single object payload.
 */
const getExpandedPropertyRows = ({
  parameter,
  schema,
  value,
  pathPrefix,
  namePrefix,
  mode,
  isDisabled,
  hiddenValuePaths,
}: {
  parameter: ParameterObject
  schema: Extract<SchemaObject, { type: 'object' }>
  value: unknown
  pathPrefix: string[]
  namePrefix: string
  mode: ExpansionMode
  isDisabled: boolean
  hiddenValuePaths: ReadonlySet<string>
}): TableRow[] => {
  if (!schema.properties) {
    return []
  }

  const requiredProperties = new Set(schema.required ?? [])

  return Object.entries(schema.properties).flatMap(([propertyName, propertySchema]) => {
    const resolvedPropertySchema = resolveSchema(propertySchema)
    if (!resolvedPropertySchema) {
      return []
    }

    const path = [...pathPrefix, propertyName]
    const name = namePrefix ? `${namePrefix}[${propertyName}]` : propertyName

    if (hiddenValuePaths.has(toPathKey(path))) {
      return []
    }

    // Only deepObject style recurses into nested objects. The OpenAPI 3.1 spec says form-style
    // explode flattens only the top-level properties.
    const shouldRecurse =
      mode === 'deepObject' && isObjectSchema(resolvedPropertySchema) && Boolean(resolvedPropertySchema.properties)

    if (shouldRecurse) {
      return getExpandedPropertyRows({
        parameter,
        schema: resolvedPropertySchema,
        value,
        pathPrefix: path,
        namePrefix: name,
        mode,
        isDisabled,
        hiddenValuePaths,
      })
    }

    return [
      toTableRow({
        parameter,
        name,
        value: getValueAtPath(value, path),
        description: resolvedPropertySchema.description ?? parameter.description,
        schema: resolvedPropertySchema,
        isRequired: requiredProperties.has(propertyName),
        isDisabled,
        sourceParameterValuePath: path,
      }),
    ]
  })
}

/**
 * Turns a single OpenAPI parameter into one or more table rows.
 *
 * For object-typed query parameters with `form`/`explode: true` (the default) or `deepObject`
 * serialization, each property becomes its own row so the user can edit them individually,
 * matching how tools like Postman present the same parameter. Every other parameter passes
 * through as a single row.
 */
export const createParameterRows = (
  parameter: ParameterObject,
  exampleKey: string,
  options: { hiddenValuePaths?: readonly string[][] } = {},
): TableRow[] => {
  const example = getExample(parameter, exampleKey, undefined)
  const isDisabled = isParamDisabled(parameter, example)
  const schema = getParameterSchema(parameter)
  const mode = getExpansionMode(parameter, schema)

  // Non-expandable parameters: render as a single row.
  if (mode === null || !schema || !isObjectSchema(schema)) {
    return [toSingleParameterRow(parameter, schema, example?.value, isDisabled)]
  }

  // Expand into per-property rows. The deserialized value is used so existing per-property values
  // can be displayed in the table even when the example arrives as a serialized string.
  const value = example?.value === undefined ? undefined : deSerializeParameter(example.value, parameter)

  // Fall back to a single row only when the schema has no properties to expand.
  if (!schema.properties) {
    return [toSingleParameterRow(parameter, schema, example?.value, isDisabled)]
  }

  const hiddenValuePaths = new Set(options.hiddenValuePaths?.map(toPathKey) ?? [])

  const rows = getExpandedPropertyRows({
    parameter,
    schema,
    value,
    pathPrefix: [],
    // deepObject names every row with a `parent[child]` prefix; form-style names use bare property names.
    namePrefix: mode === 'deepObject' ? parameter.name : '',
    mode,
    isDisabled,
    hiddenValuePaths,
  })

  return rows
}
