import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ExampleObject,
  ParameterObject,
  ParameterWithSchemaObject,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRefDeep } from '@/v2/blocks/operation-code-sample/helpers/get-resolved-ref-deep'

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
        // Ignore the error and return the original example
      }
    }
  }

  return example
}

/**
 * Resolves an example value for a parameter or request body.
 *
 * Searches in this order:
 * 1. `examples[exampleKey]` or `content.*.examples[exampleKey]`
 * 2. First example in `examples` object (if no exampleKey provided)
 * 3. Deprecated `example` field (if no exampleKey provided)
 * 4. Schema `default`, `enum[0]`, `examples[0]`, or `example` values
 *
 * Handles de-serialization of example values and is used for both
 * sending requests and generating code snippets.
 */
export const getExample = (
  param: ParameterObject | RequestBodyObject,
  exampleKey: string | undefined,
  _contentType: string | undefined,
): ExampleObject | undefined => {
  // Content based parameters
  if ('content' in param) {
    const contentType = _contentType ?? Object.keys(param.content ?? {})[0] ?? ''
    const content = param.content?.[contentType]
    const examples = content?.examples ?? {}
    const key = exampleKey || Object.keys(examples)[0] || ''
    const example = getResolvedRefDeep(examples[key])

    if (typeof example !== 'undefined') {
      return {
        ...example,
        ...(example?.value && { value: deSerializeContentExample(example.value, contentType) }),
      }
    }

    // Fallback example field if no exampleKey is provided
    if (!exampleKey && content?.example) {
      const value = getResolvedRefDeep(content.example)
      return { value: deSerializeContentExample(value, contentType) }
    }

    return undefined
  }

  // Schema based parameters
  if ('examples' in param || 'example' in param) {
    const examples = getResolvedRef(param.examples) ?? {}
    const key = exampleKey || Object.keys(examples)[0] || ''
    const example = getResolvedRefDeep(examples?.[key])

    if (typeof example !== 'undefined') {
      return {
        ...example,
        ...(example?.value && { value: deSerializeSchemaExample(example.value, param.schema) }),
      }
    }

    // Fallback example field if no exampleKey is provided
    if (!exampleKey && param.example) {
      const value = getResolvedRefDeep(param.example)
      return { value: deSerializeSchemaExample(value, param.schema) }
    }
  }

  // Derrive value from the schema
  const resolvedParam = getResolvedRefDeep(param)
  if ('schema' in resolvedParam && resolvedParam.schema) {
    // Default value
    if ('default' in resolvedParam.schema && typeof resolvedParam.schema.default !== 'undefined') {
      return { value: resolvedParam.schema.default }
    }

    // Enum value
    if ('enum' in resolvedParam.schema && typeof resolvedParam.schema.enum?.[0] !== 'undefined') {
      return { value: resolvedParam.schema.enum[0] }
    }

    // Examples value
    if ('examples' in resolvedParam.schema && typeof resolvedParam.schema.examples?.[0] !== 'undefined') {
      return { value: deSerializeSchemaExample(resolvedParam.schema.examples[0], resolvedParam.schema) }
    }

    // Example value
    if ('example' in resolvedParam.schema && typeof resolvedParam.schema.example !== 'undefined') {
      return { value: deSerializeSchemaExample(resolvedParam.schema.example, resolvedParam.schema) }
    }
  }

  return undefined
}
