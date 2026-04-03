import type { ExternalDocsObject } from './external-docs'
import type { MediaTypeListObject } from './media-type-list'
import type { ParametersListObject } from './parameters-list'
import type { ResponsesObject } from './responses'
import type { SchemesListObject } from './schemes-list'
import type { SecurityObject } from './security'
/**
 * Operation object
 *
 * Describes a single API operation on a path.
 *
 * @see {@link https://swagger.io/specification/v2/#operation-object}
 */
export type OperationObject = {
  /** A list of tags for API documentation control. Tags can be used for logical grouping of operations by resources or any other qualifier. */
  tags?: string[]
  /** A short summary of what the operation does. For maximum readability in the swagger-ui, this field SHOULD be less than 120 characters. */
  summary?: string
  /** A verbose explanation of the operation behavior. [GFM syntax](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown) can be used for rich text representation. */
  description?: string
  /** Additional external documentation for this operation. */
  externalDocs?: ExternalDocsObject
  /** Unique string used to identify the operation. The id MUST be unique among all operations described in the API. Tools and libraries MAY use the operationId to uniquely identify an operation, therefore, it is recommended to follow common programming naming conventions. */
  operationId?: string
  /** A list of MIME types the operation can produce. This overrides the [`produces`](https://swagger.io/specification/v2/#swaggerProduces) definition at the Swagger Object. An empty value MAY be used to clear the global definition. Value MUST be as described under [Mime Types](https://swagger.io/specification/v2/#mime-types). */
  produces?: MediaTypeListObject
  /** A list of MIME types the operation can consume. This overrides the [`consumes`](https://swagger.io/specification/v2/#swaggerConsumes) definition at the Swagger Object. An empty value MAY be used to clear the global definition. Value MUST be as described under [Mime Types](https://swagger.io/specification/v2/#mime-types). */
  consumes?: MediaTypeListObject
  /** A list of parameters that are applicable for this operation. If a parameter is already defined at the [Path Item](https://swagger.io/specification/v2/#pathItemParameters), the new definition will override it, but can never remove it. The list MUST NOT include duplicated parameters. A unique parameter is defined by a combination of a [name](https://swagger.io/specification/v2/#parameterName) and [location](https://swagger.io/specification/v2/#parameterIn). The list can use the [Reference Object](https://swagger.io/specification/v2/#reference-object) to link to parameters that are defined at the [Swagger Object's parameters](https://swagger.io/specification/v2/#swaggerParameters). There can be one "body" parameter at most. */
  parameters?: ParametersListObject
  /** **Required.** The list of possible responses as they are returned from executing this operation. */
  responses: ResponsesObject
  /** The transfer protocol for the operation. Values MUST be from the list: `"http"`, `"https"`, `"ws"`, `"wss"`. The value overrides the Swagger Object [`schemes`](https://swagger.io/specification/v2/#swaggerSchemes) definition. */
  schemes?: SchemesListObject
  /** Declares this operation to be deprecated. Usage of the declared operation should be refrained. Default value is `false`. */
  deprecated?: boolean
  /** A declaration of which security schemes are applied for this operation. The list of values describes alternative security schemes that can be used (that is, there is a logical OR between the security requirements). This definition overrides any declared top-level [`security`](https://swagger.io/specification/v2/#swaggerSecurity). To remove a top-level security declaration, an empty array can be used. */
  security?: SecurityObject
}
