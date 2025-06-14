import { Type, type Static } from '@sinclair/typebox'
import { ServerObjectSchema } from './server'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'

/**
 * The Link Object represents a possible design-time link for a response. The presence of a link does not guarantee the caller's ability to successfully invoke it, rather it provides a known relationship and traversal mechanism between responses and other operations.
 *
 * Unlike dynamic links (i.e. links provided in the response payload), the OAS linking mechanism does not require link information in the runtime response.
 *
 * For computing links and providing instructions to execute them, a runtime expression is used for accessing values in an operation and using them as parameters while invoking the linked operation.
 */
export const LinkObjectSchema = compose(
  Type.Object({
    /** A URI reference to an OAS operation. This field is mutually exclusive of the operationId field, and MUST point to an Operation Object. Relative operationRef values MAY be used to locate an existing Operation Object in the OpenAPI Description. */
    operationRef: Type.Optional(Type.String()),
    /** The name of an existing, resolvable OAS operation, as defined with a unique operationId. This field is mutually exclusive of the operationRef field. */
    operationId: Type.Optional(Type.String()),
    /** A map representing parameters to pass to an operation as specified with operationId or identified via operationRef. The key is the parameter name to be used (optionally qualified with the parameter location, e.g. path.id for an id parameter in the path), whereas the value can be a constant or an expression to be evaluated and passed to the linked operation. */
    parameters: Type.Optional(Type.Record(Type.String(), Type.Any())),
    /** A literal value or {expression} to use as a request body when calling the target operation. */
    requestBody: Type.Optional(Type.Any()),
    /** A description of the link. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** A server object to be used by the target operation. */
    server: Type.Optional(ServerObjectSchema),
  }),
  ExtensionsSchema,
)

export type LinkObject = Static<typeof LinkObjectSchema>
