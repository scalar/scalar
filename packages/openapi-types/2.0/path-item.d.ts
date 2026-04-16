import type { OperationObject } from './operation'
import type { ParametersListObject } from './parameters-list'
/**
 * Path Item object
 *
 * Describes the operations available on a single path. A Path Item may be empty, due to [ACL constraints](#security-filtering). The path itself is still exposed to the documentation viewer but they will not know which operations and parameters are available.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#path-item-object}
 */
export type PathItemObject = {
  $ref?: string
  /** A definition of a GET operation on this path. */
  get?: OperationObject
  /** A definition of a PUT operation on this path. */
  put?: OperationObject
  /** A definition of a POST operation on this path. */
  post?: OperationObject
  /** A definition of a DELETE operation on this path. */
  delete?: OperationObject
  /** A definition of a OPTIONS operation on this path. */
  options?: OperationObject
  /** A definition of a HEAD operation on this path. */
  head?: OperationObject
  /** A definition of a PATCH operation on this path. */
  patch?: OperationObject
  /** A list of parameters that are applicable for all the operations described under this path. These parameters can be overridden at the operation level, but cannot be removed there. The list MUST NOT include duplicated parameters. A unique parameter is defined by a combination of a [name](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterName) and [location](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterIn). The list can use the [Reference Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#reference-object) to link to parameters that are defined at the [Swagger Object's parameters](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#swaggerParameters). There can be one "body" parameter at most. */
  parameters?: ParametersListObject
}
