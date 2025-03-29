import type { z } from 'zod'
import { BasePathItemObjectSchema } from './base-path-item-object'
import { OperationObjectSchemaWithoutCallbacks } from './operation-object-without-callbacks'

type PathItemObjectSchemaWithoutCallbacks = z.infer<typeof BasePathItemObjectSchema> & {
  get?: z.infer<typeof OperationObjectSchemaWithoutCallbacks>
  put?: z.infer<typeof OperationObjectSchemaWithoutCallbacks>
  post?: z.infer<typeof OperationObjectSchemaWithoutCallbacks>
  delete?: z.infer<typeof OperationObjectSchemaWithoutCallbacks>
  options?: z.infer<typeof OperationObjectSchemaWithoutCallbacks>
  head?: z.infer<typeof OperationObjectSchemaWithoutCallbacks>
  patch?: z.infer<typeof OperationObjectSchemaWithoutCallbacks>
  trace?: z.infer<typeof OperationObjectSchemaWithoutCallbacks>
}

/**
 * Path Item Object (without callbacks)
 *
 * Describes the operations available on a single path. A Path Item MAY be empty, due to ACL constraints. The path
 * itself is still exposed to the documentation viewer but they will not know which operations and parameters are
 * available.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#path-item-object
 */
export const PathItemObjectSchemaWithoutCallbacks: z.ZodType<PathItemObjectSchemaWithoutCallbacks> =
  BasePathItemObjectSchema.extend({
    /**
     * A definition of a GET operation on this path.
     */
    get: OperationObjectSchemaWithoutCallbacks.optional(),
    /**
     * A definition of a PUT operation on this path.
     */
    put: OperationObjectSchemaWithoutCallbacks.optional(),
    /**
     * A definition of a POST operation on this path.
     */
    post: OperationObjectSchemaWithoutCallbacks.optional(),
    /**
     * A definition of a DELETE operation on this path.
     */
    delete: OperationObjectSchemaWithoutCallbacks.optional(),
    /**
     * A definition of a OPTIONS operation on this path.
     */
    options: OperationObjectSchemaWithoutCallbacks.optional(),
    /**
     * A definition of a HEAD operation on this path.
     */
    head: OperationObjectSchemaWithoutCallbacks.optional(),
    /**
     * A definition of a PATCH operation on this path.
     */
    patch: OperationObjectSchemaWithoutCallbacks.optional(),
    /**
     * A definition of a TRACE operation on this path.
     */
    trace: OperationObjectSchemaWithoutCallbacks.optional(),
  })
