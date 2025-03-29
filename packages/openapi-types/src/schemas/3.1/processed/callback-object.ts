import { z } from 'zod'
import { PathItemObjectSchemaWithoutCallbacks } from './path-item-object-without-callbacks'
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
export const CallbackObjectSchema = z.record(RuntimeExpressionSchema, PathItemObjectSchemaWithoutCallbacks)
