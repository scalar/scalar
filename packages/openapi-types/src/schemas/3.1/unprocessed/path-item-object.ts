import { z } from 'zod'
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
   * Allows for a referenced definition of this path item. The value MUST be in the form of a URI, and the referenced
   * structure MUST be in the form of a Path Item Object. In case a Path Item Object field appears both in the defined
   * object and the referenced object, the behavior is undefined. See the rules for resolving Relative References.
   *
   * Note: The behavior of $ref with adjacent properties is likely to change in future versions of this specification to
   * bring it into closer alignment with the behavior of the Reference Object.
   *
   * Q: Why don't we just use `ReferenceObjectSchema`?
   * A: References work a little bit different here. It's the only place where they can be combined with other
   *    properties.
   */
  '$ref': z.string().optional(),
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
