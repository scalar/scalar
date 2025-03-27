import { z } from 'zod'
import { ParameterObjectSchema } from './parameter-object'
import { ServerObjectSchema } from './server-object'

/**
 * Base Path Item Object Schema
 *
 * This helps break circular dependencies between path-item-object and callback-object
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#path-item-object
 */
export const BasePathItemObjectSchema = z.object({
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
})
