import { z } from 'zod'
import { RuntimeExpressionSchema } from './runtime-expression'
import { ServerObjectSchema } from './server-object'

/**
 * Link Object
 *
 * The Link Object represents a possible design-time link for a response. The presence of a link does not guarantee the
 * caller's ability to successfully invoke it, rather it provides a known relationship and traversal mechanism between
 * responses and other operations.
 *
 * Unlike dynamic links (i.e. links provided in the response payload), the OAS linking mechanism does not require link
 * information in the runtime response.
 *
 * For computing links and providing instructions to execute them, a runtime expression is used for accessing values in an
 * operation and using them as parameters while invoking the linked operation.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#link-object
 */
export const LinkObjectSchema = z.object({
  /**
   * A URI reference to an OAS operation. This field is mutually exclusive of the operationId field, and MUST point to
   * an Operation Object. Relative operationRef values MAY be used to locate an existing Operation Object in the OpenAPI Description.
   */
  operationRef: z.string().optional(),
  /**
   * The name of an existing, resolvable OAS operation, as defined with a unique operationId. This field is mutually
   * exclusive of the operationRef field.
   */
  operationId: z.string().optional(),
  /**
   * A map representing parameters to pass to an operation as specified with operationId or identified via
   * operationRef. The key is the parameter name to be used (optionally qualified with the parameter location, e.g.
   * path.id for an id parameter in the path), whereas the value can be a constant or an expression to be evaluated
   * and passed to the linked operation.
   */
  parameters: z.record(z.string(), RuntimeExpressionSchema).optional(),
  /**
   * A literal value or {expression} to use as a request body when calling the target operation.
   */
  requestBody: RuntimeExpressionSchema.optional(),
  /**
   * A description of the link. CommonMark syntax MAY be used for rich text representation.
   */
  description: z.string().optional(),
  /**
   * A server object to be used by the target operation.
   */
  server: ServerObjectSchema.optional(),
})
