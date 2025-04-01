import { z } from 'zod'
import { CallbackObjectSchema } from './callback-object'
import { OperationObjectSchemaWithoutCallbacks } from './operation-object-without-callbacks'

type OperationObject = z.infer<typeof OperationObjectSchemaWithoutCallbacks> & {
  callbacks?: Record<string, z.infer<typeof CallbackObjectSchema>>
}

/**
 * Operation Object
 *
 * Describes a single API operation on a path.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#operation-object
 */
export const OperationObjectSchema: z.ZodType<OperationObject> = OperationObjectSchemaWithoutCallbacks.extend({
  /**
   * A map of possible out-of-band callbacks related to the parent operation. Each value in the map is a
   * Path Item Object that describes a set of requests that may be initiated by the API provider and the
   * expected responses. The key value used to identify the callback object is an expression, evaluated
   * at runtime, that identifies a URL to be used for the callback operation.
   */
  'callbacks': z.record(z.string(), CallbackObjectSchema).optional(),
})
