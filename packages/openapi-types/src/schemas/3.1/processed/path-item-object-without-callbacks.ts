import { z } from 'zod'
import { ParameterObjectSchema } from './parameter-object'
import { ServerObjectSchema } from './server-object'
import { type BasePathItemObjectSchema, OperationObjectSchemaWithoutCallbacks } from './shared-path-schemas'

type PathItemObject = z.infer<typeof BasePathItemObjectSchema> & {
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
export const PathItemObjectSchemaWithoutCallbacks: z.ZodType<PathItemObject> = z.lazy(() =>
  z.object({
    /**
     * An optional, string summary, intended to apply to all operations in this path.
     */
    summary: z.string().optional(),
    /**
     * An optional, string description, intended to apply to all operations in this path. CommonMark syntax MAY be used
     * for rich text representation.
     */
    description: z.string().optional(),
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
    /**
     * An alternative server array to service all operations in this path.
     */
    servers: z.array(ServerObjectSchema).optional(),
    /**
     * A list of parameters that are applicable for all the operations described under this path. These parameters can be
     * overridden at the operation level, but cannot be removed there. The list MUST NOT include duplicated parameters. A
     * unique parameter is defined by a combination of a name and location. The list can use the Reference Object to link
     * to parameters that are defined at the OpenAPI Object's components/parameters.
     */
    parameters: z.array(ParameterObjectSchema).optional(),
  }),
)
