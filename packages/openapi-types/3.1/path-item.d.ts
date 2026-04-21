import type { OperationObject } from './operation'
import type { ParameterObject } from './parameter'
import type { ReferenceObject } from './reference'
import type { ServerObject } from './server'
/**
 * Path Item object
 *
 * Describes the operations available on a single path. A Path Item MAY be empty, due to [ACL constraints](#security-filtering). The path itself is still exposed to the documentation viewer but they will not know which operations and parameters are available.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#path-item-object}
 */
export type PathItemObject = {
  $ref?: string
  /** An optional string summary, intended to apply to all operations in this path. */
  summary?: string
  /** An optional string description, intended to apply to all operations in this path. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** An alternative `servers` array to service all operations in this path. If a `servers` array is specified at the [OpenAPI Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#oas-servers) level, it will be overridden by this value. */
  servers?: ServerObject[]
  /** A list of parameters that are applicable for all the operations described under this path. These parameters can be overridden at the operation level, but cannot be removed there. The list MUST NOT include duplicated parameters. A unique parameter is defined by a combination of a [name](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#parameter-name) and [location](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#parameter-in). The list can use the [Reference Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#reference-object) to link to parameters that are defined in the [OpenAPI Object's `components.parameters`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#components-parameters). */
  parameters?: (ParameterObject | ReferenceObject)[]
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
  /** A definition of a TRACE operation on this path. */
  trace?: OperationObject
} & Record<`x-${string}`, unknown>
