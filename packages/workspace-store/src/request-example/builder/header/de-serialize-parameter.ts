import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ParameterObject,
  ParameterWithSchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Coerces a parameter example from the UI (always a string from CodeInput) into a value
 * request building can serialize. Only structured types are parsed; primitives stay as strings.
 */
export const deSerializeParameter = (example: unknown, param: ParameterObject) => {
  if ('content' in param) {
    return deSerializeContentExample(example, Object.keys(param.content ?? {})[0] ?? '')
  }
  if ('schema' in param) {
    return deSerializeSchemaExample(example, param.schema)
  }

  return example
}

/**
 * Content-based parameters (e.g. `application/json`) may hold full JSON payloads;
 * parse those so nested structure is available to serializers.
 */
const deSerializeContentExample = (example: unknown, contentType: string) => {
  if (typeof example === 'string' && contentType.includes('json')) {
    try {
      return JSON.parse(example)
    } catch {
      return example
    }
  }
  return example
}

/** Schema types that must become arrays/objects — serializers branch on `Array.isArray` / objects. */
const structuredSchemaTypes = new Set(['array', 'object'])

/**
 * Schema-based parameters from the request editor.
 *
 * Primitives (`string`, `integer`, `number`, `boolean`, `null`) are left as the typed string
 * Only `array` and `object` values are parsed so OpenAPI style serialization can expand them.
 */
const deSerializeSchemaExample = (example: unknown, schema: ParameterWithSchemaObject['schema']) => {
  const resolvedSchema = getResolvedRef(schema)

  if (typeof example === 'string' && resolvedSchema && 'type' in resolvedSchema) {
    const type = Array.isArray(resolvedSchema.type) ? resolvedSchema.type[0] : resolvedSchema.type

    if (type && structuredSchemaTypes.has(type)) {
      try {
        return JSON.parse(example)
      } catch {
        // Arrays: users often type `foo,bar` instead of JSON — split to match default form+explode query style.
        if (type === 'array') {
          return example.split(/,\s?/).filter((v) => v !== '')
        }
      }
    }
  }

  return example
}
