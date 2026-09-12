import { getExampleFromSchema } from '@scalar/workspace-store/request-example'

/** The schema shape `getExampleFromSchema` accepts, so callers do not have to name it themselves. */
type ExampleSchema = Parameters<typeof getExampleFromSchema>[0]

/**
 * Generate a mocked response value from a schema the mock has declared.
 *
 * Every value the mock puts on the wire — an HTTP body, an SSE frame, a channel message — has to
 * satisfy the schema it was declared with, which is why this passes `includeDeprecated: true`:
 * `deprecated` marks a field as discouraged, not absent, so omitting it answered a declared JSON
 * response with zero bytes and dropped required properties. Owning the option set in one place keeps
 * a newly added response path from quietly missing that.
 *
 * Not for response headers. `emptyString` switches on format-based value generation
 * (`makeUpRandomData`), so a header declaring `format: 'date-time'` would start emitting a
 * fabricated timestamp where it emits an empty string today. Headers set `includeDeprecated` on
 * their own call instead.
 *
 * @param schema - The resolved schema to generate a value for.
 * @param variables - Values for `x-variable` substitution, usually a request's path parameters.
 *   Omitted by callers that have no request in scope, such as channel messages.
 * @returns The generated value, or `undefined` when the schema yields nothing.
 */
export const generateResponseExample = (schema: ExampleSchema, variables?: Record<string, unknown>): unknown =>
  getExampleFromSchema(schema, {
    emptyString: 'string',
    variables,
    mode: 'read',
    includeDeprecated: true,
  })
