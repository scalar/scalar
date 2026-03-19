import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ParameterObject,
  ParameterWithSchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Helper that de-serializes the example value based on the parameter type */
export const deSerializeParameter = (example: unknown, param: ParameterObject) => {
  if ('content' in param) {
    return deSerializeContentExample(example, Object.keys(param.content ?? {})[0] ?? '')
  }
  if ('schema' in param) {
    return deSerializeSchemaExample(example, param.schema)
  }

  return example
}

/** De-serialize the example value based on the content type */
const deSerializeContentExample = (example: unknown, contentType: string) => {
  if (typeof example === 'string' && contentType.includes('json')) {
    try {
      return JSON.parse(example)
    } catch {
      // Ignore the error and return the original example
    }
  }
  return example
}

/** Create a set of all the types we wish to parse as JSON */
const parseableTypesSet = new Set(['array', 'object', 'boolean', 'number', 'integer', 'null'])

/** De-serialize the example value based on the schema type */
const deSerializeSchemaExample = (example: unknown, schema: ParameterWithSchemaObject['schema']) => {
  const resolvedSchema = getResolvedRef(schema)

  if (typeof example === 'string' && resolvedSchema && 'type' in resolvedSchema) {
    const type = Array.isArray(resolvedSchema.type) ? resolvedSchema.type[0] : resolvedSchema.type

    if (type && parseableTypesSet.has(type)) {
      try {
        return JSON.parse(example)
      } catch {
        // For array types, fall back to splitting comma-separated values.
        // Users commonly enter array values as "foo,bar" or "foo, bar" in the UI
        // text field, which is not valid JSON. Per the OpenAPI spec, the default
        // serialization for query array parameters is style=form + explode=true,
        // meaning each value should be sent as a separate query parameter.
        if (type === 'array') {
          return example.split(/,\s?/).filter((v) => v !== '')
        }
        // Ignore the error and return the original example for other types
      }
    }
  }

  return example
}
