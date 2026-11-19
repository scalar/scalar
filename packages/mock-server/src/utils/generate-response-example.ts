import { getExampleFromSchema } from '@scalar/workspace-store/request-example'

/** The schema shape `getExampleFromSchema` accepts, so callers do not have to name it themselves. */
export type ExampleSchema = Parameters<typeof getExampleFromSchema>[0]

/** The source dialect travels together so normalized and original versions cannot be swapped. */
export type ExampleGenerationContext = Pick<
  NonNullable<Parameters<typeof getExampleFromSchema>[1]>,
  'openapiVersion' | 'jsonSchemaDialect' | 'originalOpenapiVersion'
>

/**
 * Generate response bodies and message payloads with response-mode defaults.
 * Headers use the generator directly to preserve empty strings and write-only values.
 */
export const generateResponseExample = (
  schema: ExampleSchema,
  variables?: Record<string, unknown>,
  generationContext: ExampleGenerationContext = {},
): unknown =>
  getExampleFromSchema(schema, {
    ...generationContext,
    emptyString: 'string',
    variables,
    mode: 'read',
  })
