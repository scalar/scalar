import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import type { Context } from 'hono'

import { pathParameters } from '@/utils/path-parameters'

/** The schema shape `getExampleFromSchema` accepts, so callers do not have to name it themselves. */
type ExampleSchema = Parameters<typeof getExampleFromSchema>[0]

/**
 * Generate a mocked response body from a response schema.
 *
 * Every response the mock serves has to satisfy the schema it declares, which is why this passes
 * `includeDeprecated: true`: `deprecated` marks a field as discouraged, not absent, so omitting it
 * answered a declared JSON response with zero bytes (or dropped a required property). Centralizing
 * the option set keeps a newly added response path from quietly missing it.
 *
 * Not for response headers. They pass no `emptyString`/`variables` today, and routing them through
 * here would change the header values a document already declares — they set
 * `includeDeprecated: true` on their own call instead.
 *
 * @param schema - The resolved response schema to generate a value for.
 * @param c - The Hono context, read for the path parameters exposed as `x-variable` values.
 * @returns The generated example value, or `undefined` when the schema yields nothing.
 */
export const generateResponseExample = (schema: ExampleSchema, c: Context): unknown =>
  getExampleFromSchema(schema, {
    emptyString: 'string',
    variables: pathParameters(c),
    mode: 'read',
    includeDeprecated: true,
  })
