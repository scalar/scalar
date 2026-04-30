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

const isParameterWithSchema = (parameter: ParameterObject): parameter is ParameterWithRequiredSchema =>
  'schema' in parameter && parameter.schema !== undefined

const resolveSchema = (schema: unknown): SchemaObject | undefined => {
  const resolvedSchema = getResolvedRef(schema as SchemaObject | { '$ref': string; '$ref-value': SchemaObject })

  return resolvedSchema as SchemaObject | undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getParameterStyleAndExplode = (parameter: ParameterObject): { style: string; explode: boolean } => {
  const style = 'style' in parameter && parameter.style ? parameter.style : 'form'
  const explode = 'explode' in parameter && parameter.explode !== undefined ? parameter.explode : style === 'form'

  return { style, explode }
}

const getValueAtPath = (source: unknown, path: readonly string[]): unknown => {
  return path.reduce<unknown>((value, key) => {
    if (!isRecord(value)) {
      return undefined
    }

    return value[key]
  }, source)
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

const getExpandedPropertyRows = ({
  parameter,
  schema,
  value,
  pathPrefix,
  namePrefix,
  isDisabled,
}: {
  parameter: ParameterObject
  schema: Extract<SchemaObject, { type: 'object' }>
  value: unknown
  pathPrefix: string[]
  namePrefix: string
  isDisabled: boolean
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

    // Only recurse into nested objects for deepObject style (namePrefix is non-empty).
    // Form-style explode flattens only the top-level properties per the OpenAPI 3.1 spec.
    if (namePrefix && isObjectSchema(resolvedPropertySchema) && resolvedPropertySchema.properties) {
      return getExpandedPropertyRows({
        parameter,
        schema: resolvedPropertySchema,
        value,
        pathPrefix: path,
        namePrefix: name,
        isDisabled,
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

export const createParameterRows = (parameter: ParameterObject, exampleKey: string): TableRow[] => {
  const example = getExample(parameter, exampleKey, undefined)
  const isDisabled = isParamDisabled(parameter, example)
  const schema = getParameterSchema(parameter)

  if (parameter.in !== 'query' || !isParameterWithSchema(parameter) || !schema || !isObjectSchema(schema)) {
    return [
      toTableRow({
        parameter,
        name: parameter.name,
        value: example?.value,
        description: parameter.description,
        schema,
        isRequired: parameter.required,
        isDisabled,
      }),
    ]
  }

  const { style, explode } = getParameterStyleAndExplode(parameter)
  if (!explode || (style !== 'form' && style !== 'deepObject')) {
    return [
      toTableRow({
        parameter,
        name: parameter.name,
        value: example?.value,
        description: parameter.description,
        schema,
        isRequired: parameter.required,
        isDisabled,
      }),
    ]
  }

  const value = example?.value === undefined ? undefined : deSerializeParameter(example.value, parameter)

  const rows = getExpandedPropertyRows({
    parameter,
    schema,
    value,
    pathPrefix: [],
    namePrefix: style === 'deepObject' ? parameter.name : '',
    isDisabled,
  })

  return rows.length > 0
    ? rows
    : [
        toTableRow({
          parameter,
          name: parameter.name,
          value: example?.value,
          description: parameter.description,
          schema,
          isRequired: parameter.required,
          isDisabled,
        }),
      ]
}
