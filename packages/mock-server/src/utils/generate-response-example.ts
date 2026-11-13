import { getExampleFromSchema } from '@scalar/workspace-store/request-example'

/** The schema shape `getExampleFromSchema` accepts, so callers do not have to name it themselves. */
export type ExampleSchema = Parameters<typeof getExampleFromSchema>[0]

/**
 * Generate response bodies and message payloads with response-mode defaults.
 * Headers use the generator directly to preserve empty strings and write-only values.
 */
export const generateResponseExample = (
  schema: ExampleSchema,
  variables?: Record<string, unknown>,
  openapiVersion?: string,
  jsonSchemaDialect?: string,
): unknown =>
  getExampleFromSchema(schema, {
    openapiVersion,
    jsonSchemaDialect,
    emptyString: 'string',
    variables,
    mode: 'read',
  })
