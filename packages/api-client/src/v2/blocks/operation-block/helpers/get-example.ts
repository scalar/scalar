import type {
  ExampleObject,
  MediaTypeObject,
  ParameterObject,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRefDeep } from '@/v2/blocks/operation-code-sample/helpers/get-resolved-ref-deep'

/** Helper to get example from examples object with fallback to example field */
const getExampleFromExamples = (
  examples: MediaTypeObject['examples'],
  exampleField: MediaTypeObject['example'],
  exampleKey: string | undefined,
): ExampleObject | undefined => {
  if (!examples && !exampleField) {
    return undefined
  }

  // Grab the example key
  const key = exampleKey || Object.keys(examples ?? {})[0] || ''
  const example = getResolvedRefDeep(examples?.[key])
  if (example !== undefined) {
    return example
  }

  // Fallback to example field if no exampleKey is provided
  if (!exampleKey && exampleField !== undefined) {
    return { value: getResolvedRefDeep(exampleField) }
  }

  return undefined
}

/**
 * Resolve an example value for a parameter or requestBody from either `examples` or `content.*.examples`.
 * Or the [deprecated] `example` field.
 * If no exampleKey is provided it will fallback to the first example in the examples object then the [deprecated]
 * `example` field.
 * Used both for send-request and generating code snippets.
 */
export const getExample = (
  param: ParameterObject | RequestBodyObject | MediaTypeObject,
  exampleKey: string | undefined,
  contentType: string | undefined,
): ExampleObject | undefined => {
  // Content based parameters
  if ('content' in param) {
    const content = param.content?.[contentType ?? Object.keys(param.content)[0] ?? '']
    const result = getExampleFromExamples(content?.examples, content?.example, exampleKey)
    if (result !== undefined) {
      return result
    }
  }

  // Schema based parameters
  if ('examples' in param || 'example' in param) {
    const result = getExampleFromExamples(param.examples, param.example, exampleKey)
    if (result !== undefined) {
      return result
    }
  }

  // Derive value from the schema
  const resolvedParam = getResolvedRefDeep(param)
  if ('schema' in resolvedParam && resolvedParam.schema) {
    const schema = resolvedParam.schema

    // Default value
    if ('default' in schema && schema.default !== undefined) {
      return { value: schema.default }
    }

    // Enum value
    if ('enum' in schema && schema.enum?.[0] !== undefined) {
      return { value: schema.enum[0] }
    }

    // Examples value
    if ('examples' in schema && schema.examples?.[0] !== undefined) {
      return { value: schema.examples[0] }
    }

    // Example value
    if ('example' in schema && schema.example !== undefined) {
      return { value: schema.example }
    }
  }

  return undefined
}
