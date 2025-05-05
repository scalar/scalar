import { z } from 'zod'
import { ComponentsObjectSchema } from './components-object'
import { ExternalDocumentationObjectSchema } from './external-documentation-object'
import { InfoObjectSchema } from './info-object'
import { PathsObjectSchema } from './paths-object'
import { SecurityRequirementObjectSchema } from './security-requirement-object'
import { ServerObjectSchema } from './server-object'
import { TagObjectSchema } from './tag-object'
import { WebhooksObjectSchema } from './webhooks-object'

export type OpenApiObject = z.infer<typeof OpenApiObjectSchema>

/**
 * OpenAPI Object
 *
 * This is the root object of the OpenAPI Description.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#openapi-object
 */
export const OpenApiObjectSchema = z.object({
  /**
   * REQUIRED. This string MUST be the version number of the OpenAPI Specification that the OpenAPI Document uses. The
   * openapi field SHOULD be used by tooling to interpret the OpenAPI Document. This is not related to the API
   * info.version string.
   */
  openapi: z.string().regex(/^3\.1\.\d+$/),
  /**
   * REQUIRED. Provides metadata about the API. The metadata MAY be used by tooling as required.
   */
  info: InfoObjectSchema,
  /**
   * The default value for the $schema keyword within Schema Objects contained within this OAS document. This MUST be
   * in the form of a URI.
   */
  jsonSchemaDialect: z.string().optional(),
  /**
   * An array of Server Objects, which provide connectivity information to a target server. If the servers field is
   * not provided, or is an empty array, the default value would be a Server Object with a url value of /.
   */
  servers: z.array(ServerObjectSchema).optional(),
  /**
   * The available paths and operations for the API.
   */
  paths: PathsObjectSchema.optional(),
  /**
   * The incoming webhooks that MAY be received as part of this API and that the API consumer MAY choose to implement.
   * Closely related to the callbacks feature, this section describes requests initiated other than by an API call,
   * for example by an out of band registration. The key name is a unique string to refer to each webhook, while the
   * (optionally referenced) Path Item Object describes a request that may be initiated by the API provider and the
   * expected responses. An example is available.
   */
  webhooks: WebhooksObjectSchema.optional(),
  /**
   * An element to hold various Objects for the OpenAPI Description.
   */
  components: ComponentsObjectSchema.optional(),
  /**
   * A declaration of which security mechanisms can be used across the API. The list of values includes alternative
   * Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied
   * to authorize a request. Individual operations can override this definition. The list can be incomplete, up to
   * being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included
   * in the array.
   */
  security: z.array(SecurityRequirementObjectSchema).optional(),
  /**
   * A list of tags used by the OpenAPI Description with additional metadata. The order of the tags can be used to
   * reflect on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared.
   * The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list
   * MUST be unique.
   */
  tags: z.array(TagObjectSchema).optional(),
  /**
   * Additional external documentation.
   */
  externalDocs: ExternalDocumentationObjectSchema.optional(),
})
