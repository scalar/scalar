import { BasePathItemObjectSchema } from './base-path-item-object'
import { OperationObjectSchema } from './operation-object'

/**
 * Path Item Object
 *
 * Describes the operations available on a single path. A Path Item MAY be empty, due to ACL constraints. The path
 * itself is still exposed to the documentation viewer but they will not know which operations and parameters are
 * available.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#path-item-object
 */
export const PathItemObjectSchema = BasePathItemObjectSchema.extend({
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
})
