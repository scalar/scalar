import type { ComponentsObject } from './components'
import type { ExternalDocumentationObject } from './external-documentation'
import type { InfoObject } from './info'
import type { PathsObject } from './paths'
import type { SecurityRequirementObject } from './security-requirement'
import type { ServerObject } from './server'
import type { TagObject } from './tag'
/**
 * Openapi object
 *
 * This is the root object of the [OpenAPI Description](#openapi-description).
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#openapi-object}
 */
export type Document = {
  /** **REQUIRED**. This string MUST be the [version number](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#versions) of the OpenAPI Specification that the OpenAPI Document uses. The `openapi` field SHOULD be used by tooling to interpret the OpenAPI Document. This is _not_ related to the API [`info.version`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#info-version) string. */
  openapi: string
  /** **REQUIRED**. Provides metadata about the API. The metadata MAY be used by tooling as required. */
  info: InfoObject
  /** Additional external documentation. */
  externalDocs?: ExternalDocumentationObject
  /** An array of Server Objects, which provide connectivity information to a target server. If the `servers` field is not provided, or is an empty array, the default value would be a [Server Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#server-object) with a [url](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#server-url) value of `/`. */
  servers?: ServerObject[]
  /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. Individual operations can override this definition. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement (`{}`) can be included in the array. */
  security?: SecurityRequirementObject[]
  /** A list of tags used by the OpenAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the [Operation Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#operation-object) must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
  tags?: TagObject[]
  /** **REQUIRED**. The available paths and operations for the API. */
  paths: PathsObject
  /** An element to hold various Objects for the OpenAPI Description. */
  components?: ComponentsObject
}
