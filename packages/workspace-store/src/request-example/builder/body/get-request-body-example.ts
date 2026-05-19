import type { ExampleObject, RequestBodyObject } from '@scalar/types/openapi/3.1'

import { getResolvedRefDeep } from '@/helpers/get-resolved-ref-deep'
import { getExample } from '@/request-example/builder/helpers/get-example'
import { getExampleFromSchema } from '@/request-example/builder/helpers/get-example-from-schema'
import { resolve } from '@/resolve'

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

  // Return existing example value if we have one
  const example = getExample(requestBody, exampleName, contentType)
  if (example) {
    return example
  }

  const resolvedSchema = resolve.schema(content?.schema)
  if (!resolvedSchema) {
    return null
  }

  // Deep-resolve nested $refs so composition branches (e.g. oneOf inside $defs) are available for example generation.
  const schema = getResolvedRefDeep(resolvedSchema)

  // Generate an example from the schema
  const schemaExample = getExampleFromSchema(
    schema,
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
