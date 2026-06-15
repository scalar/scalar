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

/**
 * Builds the row name for an expanded property at a given value path. deepObject rows mirror the
 * wire format (`parent[a][b]`); form-style explode uses the bare top-level key.
 */
const getExpandedRowName = (parameter: ParameterObject, path: string[], mode: ExpansionMode): string =>
  mode === 'deepObject' ? `${parameter.name}${path.map((segment) => `[${segment}]`).join('')}` : (path[0] ?? '')

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
  renamedValuePaths,
}: {
  parameter: ParameterObject
  schema: Extract<SchemaObject, { type: 'object' }>
  value: unknown
  pathPrefix: string[]
  namePrefix: string
  mode: ExpansionMode
  isDisabled: boolean
  hiddenValuePaths: ReadonlySet<string>
  renamedValuePaths: ReadonlyMap<string, string[]>
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

    // When this property was renamed, the value lives at the typed key instead of the schema path.
    // Keep the row in its original slot so it does not jump to the end of the table.
    const renamedTo = renamedValuePaths.get(toPathKey(path))
    const effectivePath = renamedTo ?? path

    if (hiddenValuePaths.has(toPathKey(effectivePath))) {
      return []
    }

    if (renamedTo) {
      // The value move is debounced, so until it lands the value still sits at the old schema path.
      // Fall back to it so the renamed row shows its value immediately instead of flickering empty.
      const renamedValue = getValueAtPath(value, renamedTo)

      return [
        toTableRow({
          parameter,
          name: getExpandedRowName(parameter, renamedTo, mode),
          value: renamedValue === undefined ? getValueAtPath(value, path) : renamedValue,
          description: parameter.description,
          // The renamed key no longer maps to the schema property, so it carries no schema.
          schema: undefined,
          isRequired: false,
          isDisabled,
          sourceParameterValuePath: renamedTo,
        }),
      ]
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
        renamedValuePaths,
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
 * Collects the leaf paths of an object value. In `form` mode only the top-level keys are leaves
 * (form-style explode does not flatten nested objects); in `deepObject` mode we recurse into nested
 * objects, mirroring how the rows and serialization are built.
 */
const collectValueLeafPaths = (value: unknown, mode: ExpansionMode): string[][] => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  const paths: string[][] = []

  const walk = (node: Record<string, unknown>, prefix: string[]): void => {
    for (const [key, val] of Object.entries(node)) {
      const path = [...prefix, key]

      if (mode === 'deepObject' && val !== null && typeof val === 'object' && !Array.isArray(val)) {
        walk(val as Record<string, unknown>, path)
      } else {
        paths.push(path)
      }
    }
  }

  walk(value as Record<string, unknown>, [])

  return paths
}

/**
 * Builds rows for value paths that the schema does not describe. This keeps user-edited keys (for
 * example a property that was renamed in the table) visible instead of snapping back to the
 * schema-derived rows on the next render.
 */
const getUnmappedValueRows = ({
  parameter,
  value,
  schemaRows,
  mode,
  isDisabled,
  renamedValuePaths,
}: {
  parameter: ParameterObject
  value: unknown
  schemaRows: TableRow[]
  mode: ExpansionMode
  isDisabled: boolean
  renamedValuePaths: ReadonlyMap<string, string[]>
}): TableRow[] => {
  // Skip the renamed-away source paths too: the value move is debounced, so the old key lingers in
  // the value for a moment and would otherwise flash as a duplicate row next to the renamed one.
  const seen = new Set([
    ...schemaRows.map((row) => toPathKey(row.sourceParameterValuePath ?? [])),
    ...renamedValuePaths.keys(),
  ])

  // These rows always render: a key that carries a value should stay visible. The hidden-path set
  // only suppresses empty schema suggestions, so it is intentionally not applied here.
  return collectValueLeafPaths(value, mode)
    .filter((path) => !seen.has(toPathKey(path)))
    .map((path) =>
      toTableRow({
        parameter,
        name: getExpandedRowName(parameter, path, mode),
        value: getValueAtPath(value, path),
        description: parameter.description,
        schema: undefined,
        isRequired: false,
        isDisabled,
        sourceParameterValuePath: path,
      }),
    )
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
  options: {
    hiddenValuePaths?: readonly string[][]
    renamedValuePaths?: readonly { from: string[]; to: string[] }[]
  } = {},
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
  const renamedValuePaths = new Map((options.renamedValuePaths ?? []).map(({ from, to }) => [toPathKey(from), to]))

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
    renamedValuePaths,
  })

  // Surface keys present in the value but not in the schema (for example a renamed property) so the
  // edited key keeps showing up instead of snapping back to the schema-derived rows.
  const unmappedRows = getUnmappedValueRows({
    parameter,
    value,
    schemaRows: rows,
    mode,
    isDisabled,
    renamedValuePaths,
  })

  return [...rows, ...unmappedRows]
}
