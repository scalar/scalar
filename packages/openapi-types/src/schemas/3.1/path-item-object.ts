import { z } from 'zod'
import { OperationObjectSchema } from './operation-object'
import { ParameterObjectSchema } from './parameter-object'
import { ServerObjectSchema } from './server-object'
import { BasePathItemObjectSchema } from './shared-path-schemas'

/**
 * Path Item Object
 *
 * Describes the operations available on a single path. A Path Item MAY be empty, due to ACL constraints. The path
 * itself is still exposed to the documentation viewer but they will not know which operations and parameters are
 * available.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#path-item-object
 */
export type PathItemObject = z.infer<typeof BasePathItemObjectSchema> & {
  get?: z.infer<typeof OperationObjectSchema>
  put?: z.infer<typeof OperationObjectSchema>
  post?: z.infer<typeof OperationObjectSchema>
  delete?: z.infer<typeof OperationObjectSchema>
  options?: z.infer<typeof OperationObjectSchema>
  head?: z.infer<typeof OperationObjectSchema>
  patch?: z.infer<typeof OperationObjectSchema>
  trace?: z.infer<typeof OperationObjectSchema>
}

export const PathItemObjectSchema: z.ZodType<PathItemObject> = z.lazy(() =>
  BasePathItemObjectSchema.extend({
    /**
     * Allows for a referenced definition of this path item. The referenced structure MUST be in the form of a Path Item
     * Object. In case a Path Item Object field appears both in the defined object and the referenced object, the behavior
     * is undefined. See the rules for resolving Relative References.
     */
    $ref: z.string().optional(),
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
    get: OperationObjectSchema.optional(),
    /**
     * A definition of a PUT operation on this path.
     */
    put: OperationObjectSchema.optional(),
    /**
     * A definition of a POST operation on this path.
     */
    post: OperationObjectSchema.optional(),
    /**
     * A definition of a DELETE operation on this path.
     */
    delete: OperationObjectSchema.optional(),
    /**
     * A definition of a OPTIONS operation on this path.
     */
    options: OperationObjectSchema.optional(),
    /**
     * A definition of a HEAD operation on this path.
     */
    head: OperationObjectSchema.optional(),
    /**
     * A definition of a PATCH operation on this path.
     */
    patch: OperationObjectSchema.optional(),
    /**
     * A definition of a TRACE operation on this path.
     */
    trace: OperationObjectSchema.optional(),
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
