import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ParameterObject,
  ParameterWithSchemaObject,
  ReferenceType,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

type ParameterWithRequiredSchema = ParameterWithSchemaObject & {
  schema: ReferenceType<SchemaObject>
}

const isParameterWithSchema = (parameter: ParameterObject): parameter is ParameterWithRequiredSchema =>
  'schema' in parameter && parameter.schema !== undefined

const resolveSchema = (schema: unknown): SchemaObject | undefined => {
  const resolvedSchema = getResolvedRef(schema as SchemaObject | { '$ref': string; '$ref-value': SchemaObject })

  return resolvedSchema as SchemaObject | undefined
}

const toFlattenedDeepObjectParameter = (
  parameter: ParameterWithRequiredSchema,
  name: string,
  description: string | undefined,
  required: boolean,
  schema: SchemaObject,
): ParameterWithRequiredSchema => {
  const { example: _example, examples: _examples, ...parameterWithoutExamples } = parameter

  return {
    ...parameterWithoutExamples,
    name,
    description,
    required,
    schema,
  }
}

const flattenDeepObjectProperties = (
  parameter: ParameterWithRequiredSchema,
  schema: Extract<SchemaObject, { type: 'object' }>,
  namePrefix: string,
): ParameterObject[] => {
  if (!schema.properties) {
    return [parameter]
  }

  const requiredProperties = new Set(schema.required ?? [])
  const flattenedParameters = Object.entries(schema.properties).flatMap(([propertyName, propertySchema]) => {
    const resolvedPropertySchema = resolveSchema(propertySchema)
    if (!resolvedPropertySchema) {
      return []
    }

    const nestedName = `${namePrefix}[${propertyName}]`
    const nestedParameter = toFlattenedDeepObjectParameter(
      parameter,
      nestedName,
      resolvedPropertySchema.description ?? parameter.description,
      requiredProperties.has(propertyName),
      resolvedPropertySchema,
    )

    if (isObjectSchema(resolvedPropertySchema) && resolvedPropertySchema.properties) {
      return flattenDeepObjectProperties(nestedParameter, resolvedPropertySchema, nestedName)
    }

    return [nestedParameter]
  })

  return flattenedParameters.length > 0 ? flattenedParameters : [parameter]
}

/**
 * Deep object query parameters serialize as name[prop] pairs in URLs.
 * Rendering the same shape keeps docs aligned with the request UI.
 */
export const flattenDeepObjectQueryParameter = (parameter: ParameterObject): ParameterObject[] => {
  if (parameter.in !== 'query' || !isParameterWithSchema(parameter) || parameter.style !== 'deepObject') {
    return [parameter]
  }

  const resolvedSchema = resolveSchema(parameter.schema)
  if (!resolvedSchema || !isObjectSchema(resolvedSchema)) {
    return [parameter]
  }

  return flattenDeepObjectProperties(parameter, resolvedSchema, parameter.name)
}
