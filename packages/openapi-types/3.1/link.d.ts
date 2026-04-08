import type { MapOfStringsObject } from './map-of-strings'
import type { ServerObject } from './server'
/**
 * Link object
 *
 * The Link Object represents a possible design-time link for a response. The presence of a link does not guarantee the caller's ability to successfully invoke it, rather it provides a known relationship and traversal mechanism between responses and other operations.  Unlike _dynamic_ links (i.e. links provided **in** the response payload), the OAS linking mechanism does not require link information in the runtime response.  For computing links and providing instructions to execute them, a [runtime expression](#runtime-expressions) is used for accessing values in an operation and using them as parameters while invoking the linked operation.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#link-object}
 */
export type LinkObject = {
  /** A URI reference to an OAS operation. This field is mutually exclusive of the `operationId` field, and MUST point to an [Operation Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#operation-object). Relative `operationRef` values MAY be used to locate an existing [Operation Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#operation-object) in the OpenAPI Description. */
  operationRef?: string
  /** The name of an _existing_, resolvable OAS operation, as defined with a unique `operationId`. This field is mutually exclusive of the `operationRef` field. */
  operationId?: string
  /** A map representing parameters to pass to an operation as specified with `operationId` or identified via `operationRef`. The key is the parameter name to be used (optionally qualified with the parameter location, e.g. `path.id` for an `id` parameter in the path), whereas the value can be a constant or an expression to be evaluated and passed to the linked operation. */
  parameters?: MapOfStringsObject
  /** A literal value or [{expression}](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#runtime-expressions) to use as a request body when calling the target operation. */
  requestBody?: boolean
  /** A description of the link. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** A server object to be used by the target operation. */
  server?: ServerObject
} & Record<`x-${string}`, unknown>
