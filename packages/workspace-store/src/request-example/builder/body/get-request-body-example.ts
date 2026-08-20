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
 * Generate a write-mode example directly from a request body's schema, ignoring any stored example.
 *
 * This is the schema-generation half of {@link getExampleFromBody}. It is exposed on its own so
 * callers that need to regenerate a body for a freshly selected composition branch (rather than the
 * edited example that would otherwise shadow it) produce the exact same value the initial example
 * does. The schema is deep-resolved first so nested `$ref` members (common for composition branches)
 * are materialized instead of emitting `null` for referenced sub-objects.
 *
 * Returns `undefined` when there is no schema for the content type.
 */
export const getSchemaExampleFromBody = (
  requestBody: RequestBodyObject,
  contentType: string,
  requestBodyCompositionSelection?: Record<string, number>,
): unknown => {
  const schema = getResolvedRef(requestBody.content?.[contentType]?.schema)
  if (!schema) {
    return undefined
  }

  const resolvedSchema = getResolvedRefDeep(schema) as SchemaObject

  return getExampleFromSchema(
    resolvedSchema,
    {
      mode: 'write',
      compositionSelection: requestBodyCompositionSelection,
    },
    {
      schemaPath: ['requestBody'],
    },
  )
}

/**
 * Basically getExample + we generate an example from the schema if no example is found
 */
export const getExampleFromBody = (
  requestBody: RequestBodyObject,
  contentType: string,
  exampleName: string,
  requestBodyCompositionSelection?: Record<string, number>,
): ExampleObject | null => {
  // Return the existing example when it carries a usable value. An example that only has an
  // `externalValue` (not yet resolved to a `value`) is treated as missing, so we fall back to a
  // schema-generated example instead of building an empty request body.
  const example = getExample(requestBody, exampleName, contentType)
  if (example && example.value !== undefined) {
    return example
  }

  // Generate an example from the schema
  const schemaExample = getSchemaExampleFromBody(requestBody, contentType, requestBodyCompositionSelection)
  if (!schemaExample) {
    return null
  }

  return { value: schemaExample }
}
