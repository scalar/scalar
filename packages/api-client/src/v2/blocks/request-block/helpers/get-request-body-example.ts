import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ExampleObject, RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getExampleFromSchema } from '@/v2/blocks/operation-code-sample/helpers/get-example-from-schema'

/** Grab the resolved reference to the example from the request body, or build an example from the schema */
export const getExampleFromBody = (
  requestBody: RequestBodyObject,
  contentType: string,
  exampleKey: string,
): ExampleObject | null => {
  const content = requestBody.content?.[contentType]

  // Return existing example value if we have one
  const resolved = getResolvedRef(content?.examples?.[exampleKey])
  if (resolved) {
    return resolved
  }

  const schema = getResolvedRef(content?.schema)
  if (!schema) {
    return null
  }

  // Generate an example from the schema
  const example = getExampleFromSchema(schema, { mode: 'write' })
  if (!example) {
    return null
  }

  return { value: example }
}
