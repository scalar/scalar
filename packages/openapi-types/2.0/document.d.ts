import type { DefinitionsObject } from './definitions'
import type { ExternalDocsObject } from './external-docs'
import type { InfoObject } from './info'
import type { MediaTypeListObject } from './media-type-list'
import type { ParameterDefinitionsObject } from './parameter-definitions'
import type { PathsObject } from './paths'
import type { ResponseDefinitionsObject } from './response-definitions'
import type { SchemesListObject } from './schemes-list'
import type { SecurityDefinitionsObject } from './security-definitions'
import type { SecurityObject } from './security'
import type { TagObject } from './tag'
/**
 * Swagger object
 *
 * This is the root document object for the API specification. It combines what previously was the Resource Listing and API Declaration (version 1.2 and earlier) together into one document.
 *
 * @see {@link https://swagger.io/specification/v2/#swagger-object}
 */
export type Document = {
  /** **Required.** Specifies the Swagger Specification version being used. It can be used by the Swagger UI and other clients to interpret the API listing. The value MUST be `"2.0"`. */
  swagger: '2.0'
  /** **Required.** Provides metadata about the API. The metadata can be used by the clients if needed. */
  info: InfoObject
  /** The host (name or ip) serving the API. This MUST be the host only and does not include the scheme nor sub-paths. It MAY include a port. If the `host` is not included, the host serving the documentation is to be used (including the port). The `host` does not support [path templating](https://swagger.io/specification/v2/#path-templating). */
  host?: string
  /** The base path on which the API is served, which is relative to the [`host`](https://swagger.io/specification/v2/#swaggerHost). If it is not included, the API is served directly under the `host`. The value MUST start with a leading slash (`/`). The `basePath` does not support [path templating](https://swagger.io/specification/v2/#path-templating). */
  basePath?: string
  /** The transfer protocol of the API. Values MUST be from the list: `"http"`, `"https"`, `"ws"`, `"wss"`. If the `schemes` is not included, the default scheme to be used is the one used to access the Swagger definition itself. */
  schemes?: SchemesListObject
  /** A list of MIME types the APIs can consume. This is global to all APIs but can be overridden on specific API calls. Value MUST be as described under [Mime Types](https://swagger.io/specification/v2/#mime-types). */
  consumes?: MediaTypeListObject
  /** A list of MIME types the APIs can produce. This is global to all APIs but can be overridden on specific API calls. Value MUST be as described under [Mime Types](https://swagger.io/specification/v2/#mime-types). */
  produces?: MediaTypeListObject
  /** **Required.** The available paths and operations for the API. */
  paths: PathsObject
  /** An object to hold data types produced and consumed by operations. */
  definitions?: DefinitionsObject
  /** An object to hold parameters that can be used across operations. This property *does not* define global parameters for all operations. */
  parameters?: ParameterDefinitionsObject
  /** An object to hold responses that can be used across operations. This property *does not* define global responses for all operations. */
  responses?: ResponseDefinitionsObject
  /** A declaration of which security schemes are applied for the API as a whole. The list of values describes alternative security schemes that can be used (that is, there is a logical OR between the security requirements). Individual operations can override this definition. */
  security?: SecurityObject
  /** Security scheme definitions that can be used across the specification. */
  securityDefinitions?: SecurityDefinitionsObject
  /** A list of tags used by the specification with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the [Operation Object](https://swagger.io/specification/v2/#operation-object) must be declared. The tags that are not declared may be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
  tags?: TagObject[]
  /** Additional external documentation. */
  externalDocs?: ExternalDocsObject
}
