import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ExampleObject,
  ParameterObject,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRefDeep } from '@/v2/blocks/operation-code-sample/helpers/get-resolved-ref-deep'

/**
 * Resolve an example value for a parameter or requestBody from either `examples` or `content.*.examples`.
 * Or the [deprecated] `example` field.
 * If no exampleKey is provided it will fallback to the first example in the examples object then the [deprecated]
 * `example` field.
 * Used both for send-request and generating code snippets.
 */
export const getExample = (
  param: ParameterObject | RequestBodyObject,
  exampleKey: string | undefined,
  contentType: string | undefined,
): ExampleObject | undefined => {
  // Content based parameters
  if ('content' in param) {
    const content = param.content?.[contentType ?? Object.keys(param.content)[0] ?? '']
    const examples = content?.examples ?? {}
    const key = exampleKey ?? Object.keys(examples)[0] ?? ''
    const example = getResolvedRefDeep(examples[key])

    if (typeof example !== 'undefined') {
      return example
    }
    // Fallback to [deprecated] `example` field if no exampleKey is provided
    if (!exampleKey && content?.example) {
      return { value: getResolvedRefDeep(content.example) }
    }

    return undefined
  }

  // Schema based parameters
  if ('examples' in param || 'example' in param) {
    const examples = getResolvedRef(param.examples) ?? {}
    const key = exampleKey ?? Object.keys(examples)[0] ?? ''
    const example = getResolvedRefDeep(examples?.[key])

    if (typeof example !== 'undefined') {
      return example
    }

    // Fallback to [deprecated] `example` field if no exampleKey is provided
    if (!exampleKey && param.example) {
      return { value: getResolvedRefDeep(param.example) }
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
    if ('enum' in resolvedParam.schema && resolvedParam.schema.enum?.[0]) {
      return { value: resolvedParam.schema.enum[0] }
    }

    // Examples value
    if ('examples' in resolvedParam.schema && resolvedParam.schema.examples?.[0]) {
      return { value: resolvedParam.schema.examples[0] }
    }

    // [deprecated] example value
    if ('example' in resolvedParam.schema && resolvedParam.schema.example) {
      return { value: resolvedParam.schema.example }
    }
  }

  return undefined
}
