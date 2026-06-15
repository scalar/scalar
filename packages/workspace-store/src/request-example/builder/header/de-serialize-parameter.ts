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
    return deSerializeSchemaValue(example, param.schema)
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
 * Find the structured (`array` or `object`) type a schema represents, looking through
 * `anyOf`/`oneOf`/`allOf` composition.
 *
 * Optional array/object parameters are commonly described as `anyOf: [{ type: 'array' }, { type: 'null' }]`
 * (e.g. FastAPI/Pydantic `Optional[List[str]]`). Without unwrapping these we would treat the value as a
 * plain string and send a single `id=a,b` query parameter instead of repeating `id=a&id=b`.
 */
const getStructuredType = (schema: unknown): 'array' | 'object' | undefined => {
  const resolved = getResolvedRef(schema)
  if (!resolved || typeof resolved !== 'object') {
    return undefined
  }

  if ('type' in resolved && resolved.type) {
    const type = Array.isArray(resolved.type)
      ? resolved.type.find((t: string) => structuredSchemaTypes.has(t))
      : resolved.type
    if (type === 'array' || type === 'object') {
      return type
    }
  }

  for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
    const subSchemas = (resolved as Record<string, unknown>)[key]
    if (Array.isArray(subSchemas)) {
      for (const subSchema of subSchemas) {
        const type = getStructuredType(subSchema)
        if (type) {
          return type
        }
      }
    }
  }

  return undefined
}

/**
 * Coerces a single schema-typed value from the request editor (always a string from CodeInput)
 * back into the structure its schema describes.
 *
 * Primitives (`string`, `integer`, `number`, `boolean`, `null`) are left as the typed string.
 * Only `array` and `object` values are parsed so OpenAPI style serialization can expand them.
 *
 * Exposed on its own (not just through {@link deSerializeParameter}) so callers that reassemble an
 * expanded object parameter from individual rows — e.g. a `deepObject` query parameter edited row by
 * row in the API client — can coerce each leaf against its property schema. Otherwise an edited array
 * leaf stays the comma-joined display string and collapses back into a single `key=1,2` entry.
 */
export const deSerializeSchemaValue = (example: unknown, schema: ParameterWithSchemaObject['schema']) => {
  if (typeof example === 'string') {
    const type = getStructuredType(schema)

    if (type) {
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
