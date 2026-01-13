import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ExampleObject, RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getExample } from '@/v2/blocks/operation-block/helpers/get-example'
import { getExampleFromSchema } from '@/v2/blocks/operation-code-sample/helpers/get-example-from-schema'

/**
 * Basically getExample + we generate an example from the schema if no example is found
 */
export const getExampleFromBody = (
  requestBody: RequestBodyObject,
  contentType: string,
  exampleKey: string,
): ExampleObject | null => {
  const content = requestBody.content?.[contentType]

  // Return existing example value if we have one
  const example = getExample(requestBody, exampleKey, contentType)
  if (example) {
    return example
  }

  const schema = getResolvedRef(content?.schema)
  if (!schema) {
    return null
  }

  // Generate an example from the schema
  const schemaExample = getExampleFromSchema(schema, { mode: 'write' })
  if (!schemaExample) {
    return null
  }

  return { value: schemaExample }
}
