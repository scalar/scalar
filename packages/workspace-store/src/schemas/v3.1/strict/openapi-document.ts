import {
  Type,
  type Static,
  type TArray,
  type TIntersect,
  type TObject,
  type TOptional,
  type TRecord,
  type TString,
} from '@sinclair/typebox'
import { InfoObjectSchema } from './info'
import { ServerObjectSchema } from './server'
import { PathsObjectSchema } from './paths'
import { ComponentsObjectSchema } from './components'
import { SecurityRequirementObjectSchema } from './security-requirement'
import { TagObjectSchema } from './tag'
import { ExternalDocumentationObjectSchema } from './external-documentation'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'
import { PathItemObjectSchema } from '@/schemas/v3.1/strict/path-operations'

const OpenApiExtensionsSchema = Type.Partial(
  Type.Object({
    'x-tagGroups': Type.Array(
      compose(
        Type.Object({
          tags: Type.Array(Type.String()),
        }),
        TagObjectSchema,
      ),
    ),
  }),
)

/**
 * The type annotation is needed because the inferred type of this node exceeds the maximum length the compiler will serialize.
 * This is due to the complex nested structure of the OpenAPI document schema, which includes multiple optional fields,
 * arrays, and nested objects. The explicit type annotation helps TypeScript handle this large type definition.
 */
export type OpenApiDocumentSchemaType = TIntersect<
  [
    TObject<{
      openapi: TString
      info: typeof InfoObjectSchema
      jsonSchemaDialect: TOptional<TString>
      servers: TOptional<TArray<typeof ServerObjectSchema>>
      paths: TOptional<typeof PathsObjectSchema>
      webhooks: TOptional<TRecord<TString, typeof PathItemObjectSchema>>
      components: TOptional<typeof ComponentsObjectSchema>
      security: TOptional<TArray<typeof SecurityRequirementObjectSchema>>
      tags: TOptional<TArray<typeof TagObjectSchema>>
      externalDocs: TOptional<typeof ExternalDocumentationObjectSchema>
    }>,
    typeof ExtensionsSchema,
    typeof OpenApiExtensionsSchema,
  ]
>

export const OpenAPIDocumentSchema: OpenApiDocumentSchemaType = compose(
  Type.Object({
    /** REQUIRED. This string MUST be the version number of the OpenAPI Specification that the OpenAPI Document uses. The openapi field SHOULD be used by tooling to interpret the OpenAPI Document. This is not related to the API info.version string. */
    openapi: Type.String(),
    /** REQUIRED. Provides metadata about the API. The metadata MAY be used by tooling as required. */
    info: InfoObjectSchema,
    /** The default value for the $schema keyword within Schema Objects contained within this OAS document. This MUST be in the form of a URI. */
    jsonSchemaDialect: Type.Optional(Type.String()),
    /** An array of Server Objects, which provide connectivity information to a target server. If the servers field is not provided, or is an empty array, the default value would be a Server Object with a url value of /. */
    servers: Type.Optional(Type.Array(ServerObjectSchema)),
    /** The available paths and operations for the API. */
    paths: Type.Optional(PathsObjectSchema),
    /** The incoming webhooks that MAY be received as part of this API and that the API consumer MAY choose to implement. Closely related to the callbacks feature, this section describes requests initiated other than by an API call, for example by an out of band registration. The key name is a unique string to refer to each webhook, while the (optionally referenced) Path Item Object describes a request that may be initiated by the API provider and the expected responses. An example is available. */
    webhooks: Type.Optional(Type.Record(Type.String(), PathItemObjectSchema)),
    /** An element to hold various Objects for the OpenAPI Description. */
    components: Type.Optional(ComponentsObjectSchema),
    /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. Individual operations can override this definition. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
    security: Type.Optional(Type.Array(SecurityRequirementObjectSchema)),
    /** A list of tags used by the OpenAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
    tags: Type.Optional(Type.Array(TagObjectSchema)),
    /** Additional external documentation. */
    externalDocs: Type.Optional(ExternalDocumentationObjectSchema),
  }),
  ExtensionsSchema,
  OpenApiExtensionsSchema,
)

export type OpenApiDocument = Static<typeof OpenAPIDocumentSchema>
