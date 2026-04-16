import type { ComponentsObject } from './components'
import type { ExternalDocumentationObject } from './external-documentation'
import type { InfoObject } from './info'
import type { PathItemObject } from './path-item'
import type { PathsObject } from './paths'
import type { SecurityRequirementObject } from './security-requirement'
import type { ServerObject } from './server'
import type { TagObject } from './tag'
/**
 * Openapi object
 *
 * This is the root object of the [OpenAPI Description](#openapi-description).
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#openapi-object}
 */
export type Document = {
  /** **REQUIRED**. This string MUST be the [version number](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#versions) of the OpenAPI Specification that the OpenAPI Document uses. The `openapi` field SHOULD be used by tooling to interpret the OpenAPI Document. This is _not_ related to the [`info.version`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#info-version) string, which is the version of the OpenAPI Document. */
  openapi: string
  /** **REQUIRED**. Provides metadata about the API. The metadata MAY be used by tooling as required. */
  info: InfoObject
  /** The default value for the `$schema` keyword within [Schema Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#schema-object) contained within this OAS document. This MUST be in the form of a URI. */
  jsonSchemaDialect?: string
  /** An array of Server Objects, which provide connectivity information to a target server. If the `servers` field is not provided, or is an empty array, the default value would be a [Server Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#server-object) with a [url](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#server-url) value of `/`. */
  servers?: ServerObject[]
  /** The available paths and operations for the API. */
  paths?: PathsObject
  /** The incoming webhooks that MAY be received as part of this API and that the API consumer MAY choose to implement. Closely related to the `callbacks` feature, this section describes requests initiated other than by an API call, for example by an out of band registration. The key name is a unique string to refer to each webhook, while the (optionally referenced) Path Item Object describes a request that may be initiated by the API provider and the expected responses. An [example](https://learn.openapis.org/examples/v3.1/webhook-example.html) is available. */
  webhooks?: Record<string, PathItemObject>
  /** An element to hold various Objects for the OpenAPI Description. */
  components?: ComponentsObject
  /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. Individual operations can override this definition. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement (`{}`) can be included in the array. */
  security?: SecurityRequirementObject[]
  /** A list of tags used by the OpenAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the [Operation Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#operation-object) must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
  tags?: TagObject[]
  /** Additional external documentation. */
  externalDocs?: ExternalDocumentationObject
} & Record<`x-${string}`, unknown>
