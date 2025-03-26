import { z } from 'zod'
import { PathItemObjectSchema } from './path-item-object'
import { RuntimeExpressionSchema } from './runtime-expression'

/**
 * Callback Object
 *
 * A map of possible out-of-band callbacks related to the parent operation. Each value in the map is a
 * Path Item Object that describes a set of requests that may be initiated by the API provider and the
 * expected responses. The key value used to identify the callback object is an expression, evaluated
 * at runtime, that identifies a URL to be used for the callback operation.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#callback-object
 */
export type CallbackObject = Record<string, z.infer<typeof PathItemObjectSchema>>

export const CallbackObjectSchema: z.ZodType<CallbackObject> = z.lazy(() =>
  z.record(
    RuntimeExpressionSchema,
    z.lazy(() => PathItemObjectSchema),
  ),
)
