import type {
  ExampleObject,
  MediaTypeObject,
  ParameterObject,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRef } from '@/helpers/get-resolved-ref'

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
  if (!exampleName) {
    return undefined
  }

  // Content based parameters
  if ('content' in param) {
    const content = param.content?.[contentType ?? Object.keys(param.content)[0] ?? '']

    const result = content?.examples?.[exampleName]
    if (result !== undefined) {
      return getResolvedRef(result)
    }
  }

  // Schema based parameters
  if ('examples' in param) {
    const result = param.examples?.[exampleName]
    if (result !== undefined) {
      return getResolvedRef(result)
    }
  }

  return undefined
}
