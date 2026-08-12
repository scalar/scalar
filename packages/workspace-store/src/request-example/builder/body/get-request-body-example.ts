import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ExampleObject,
  RequestBodyObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRefDeep } from '@/helpers/get-resolved-ref-deep'
import { getExample } from '@/request-example/builder/helpers/get-example'
import { getExampleFromSchema } from '@/request-example/builder/helpers/get-example-from-schema'

/**
 * Basically getExample + we generate an example from the schema if no example is found
 */
export const getExampleFromBody = (
  requestBody: RequestBodyObject,
  contentType: string,
  exampleName: string,
  requestBodyCompositionSelection?: Record<string, number>,
): ExampleObject | null => {
  const content = requestBody.content?.[contentType]

  // Return the existing example when it carries a usable value. An example that only has an
  // `externalValue` (not yet resolved to a `value`) is treated as missing, so we fall back to a
  // schema-generated example instead of building an empty request body.
  const example = getExample(requestBody, exampleName, contentType)
  if (example && example.value !== undefined) {
    return example
  }

  const schema = getResolvedRef(content?.schema)
  if (!schema) {
    return null
  }

  const resolvedSchema = getResolvedRefDeep(schema) as SchemaObject

  // Generate an example from the schema
  const schemaExample = getExampleFromSchema(
    resolvedSchema,
    {
      mode: 'write',
      compositionSelection: requestBodyCompositionSelection,
    },
    {
      schemaPath: ['requestBody'],
    },
  )
  if (!schemaExample) {
    return null
  }

  return { value: schemaExample }
}
