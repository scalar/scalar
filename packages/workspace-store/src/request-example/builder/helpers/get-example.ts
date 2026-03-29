import type {
  ExampleObject,
  MediaTypeObject,
  ParameterObject,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRef } from '@/helpers/get-resolved-ref'

/** Helper to get example from examples object with fallback to example field */
const getExampleFromExamples = (
  examples: MediaTypeObject['examples'],
  exampleField: MediaTypeObject['example'],
  exampleName: string | undefined,
): ExampleObject | undefined => {
  if (!examples && !exampleField) {
    return undefined
  }

  const hasExamples = !!examples && Object.keys(examples).length > 0

  // Grab the example key
  const key = exampleName || Object.keys(examples ?? {})[0] || ''
  const example = getResolvedRef(examples?.[key])
  if (example !== undefined) {
    return example
  }

  // Fallback to example field when no examples map exists,
  // or when no specific example key was requested.
  if ((!hasExamples || !exampleName) && exampleField !== undefined) {
    return { value: getResolvedRef(exampleField) }
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
  exampleName: string | undefined,
  contentType: string | undefined,
): ExampleObject | undefined => {
  // Content based parameters
  if ('content' in param) {
    const content = param.content?.[contentType ?? Object.keys(param.content)[0] ?? '']
    const result = getExampleFromExamples(content?.examples, content?.example, exampleName)
    if (result !== undefined) {
      return result
    }
  }

  // Schema based parameters
  if ('examples' in param || 'example' in param) {
    const result = getExampleFromExamples(param.examples, param.example, exampleName)
    if (result !== undefined) {
      return result
    }
  }

  // Derive value from the schema
  const resolvedParam = getResolvedRef(param)
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
