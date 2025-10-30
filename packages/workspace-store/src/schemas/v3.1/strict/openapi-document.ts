import { type TSchema, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { extensions } from '@/schemas/extensions'
import { type XTagGroups, XTagGroupsSchema } from '@/schemas/extensions/tag/x-tag-groups'
import {
  TraversedDescriptionSchemaDefinition,
  type TraversedDocument,
  TraversedDocumentSchemaDefinition,
  TraversedEntrySchemaDefinition,
  TraversedOperationSchemaDefinition,
  TraversedSchemaSchemaDefinition,
  TraversedTagSchemaDefinition,
  TraversedWebhookSchemaDefinition,
} from '@/schemas/navigation'

import { CallbackObjectSchemaDefinition } from './callback'
import {
  type XScalarClientConfigCookies,
  xScalarClientConfigCookiesSchema,
} from './client-config-extensions/x-scalar-client-config-cookies'
import {
  type XScalarClientConfigEnvironments,
  xScalarClientConfigEnvironmentsSchema,
} from './client-config-extensions/x-scalar-client-config-environments'
import { type ComponentsObject, ComponentsObjectSchemaDefinition } from './components'
import { ContactObjectSchemaDefinition } from './contact'
import { DiscriminatorObjectSchemaDefinition } from './discriminator'
import { EncodingObjectSchemaDefinition } from './encoding'
import { ExampleObjectSchemaDefinition } from './example'
import { type ExternalDocumentationObject, ExternalDocumentationObjectSchemaDefinition } from './external-documentation'
import { HeaderObjectSchemaDefinition } from './header'
import { type InfoObject, InfoObjectSchemaDefinition } from './info'
import { LicenseObjectSchemaDefinition } from './license'
import { LinkObjectSchemaDefinition } from './link'
import { MediaTypeObjectSchemaDefinition } from './media-type'
import { OAuthFlowsObjectSchemaDefinition } from './oauthflows'
import { OperationObjectSchemaDefinition } from './operation'
import { ParameterObjectSchemaDefinition } from './parameter'
import { PathItemObjectSchemaDefinition } from './path-item'
import { type PathsObject, PathsObjectSchemaDefinition } from './paths'
import {
  ComponentsObjectRef,
  ExternalDocumentationObjectRef,
  InfoObjectRef,
  PathItemObjectRef,
  PathsObjectRef,
  REF_DEFINITIONS,
  SecurityRequirementObjectRef,
  ServerObjectRef,
  TagObjectRef,
  TraversedDocumentObjectRef,
} from './ref-definitions'
import { RequestBodyObjectSchemaDefinition } from './request-body'
import { ResponseObjectSchemaDefinition } from './response'
import { ResponsesObjectSchemaDefinition } from './responses'
import { SchemaObjectSchemaDefinition } from './schema'
import { type SecurityRequirementObject, SecurityRequirementObjectSchemaDefinition } from './security-requirement'
import { SecuritySchemeObjectSchemaDefinition } from './security-scheme'
import { type ServerObject, ServerObjectSchemaDefinition } from './server'
import { ServerVariableObjectSchemaDefinition } from './server-variable'
import { type TagObject, TagObjectSchemaDefinition } from './tag'
import { XMLObjectSchemaDefinition } from './xml'

const OpenApiExtensionsSchema = compose(
  Type.Partial(
    Type.Object({
      'x-scalar-client-config-active-environment': Type.String(),
      /** A custom icon representing the collection */
      'x-scalar-client-config-icon': Type.String(),
      'x-scalar-client-config-environments': xScalarClientConfigEnvironmentsSchema,
      'x-scalar-client-config-cookies': xScalarClientConfigCookiesSchema,
      'x-original-oas-version': Type.String(),
      'x-scalar-selected-security': Type.Array(SecurityRequirementObjectRef),
      'x-scalar-original-source-url': Type.String(),
      'x-scalar-watch-mode': Type.Boolean(),
      [extensions.document.navigation]: TraversedDocumentObjectRef,
    }),
  ),
  Type.Partial(XTagGroupsSchema),
  Type.Object({
    'x-scalar-original-document-hash': Type.String(),
  }),
)

export type OpenAPIExtensions = Partial<
  {
    'x-scalar-client-config-active-environment': string
    /** A custom icon representing the collection */
    'x-scalar-client-config-icon': string
    'x-scalar-client-config-environments': XScalarClientConfigEnvironments
    'x-scalar-client-config-cookies': XScalarClientConfigCookies
    'x-original-oas-version': string
    'x-scalar-selected-security': SecurityRequirementObject[]
    /** Original document source url / when loading a document from an external source */
    'x-scalar-original-source-url': string
    'x-scalar-watch-mode': boolean
    [extensions.document.navigation]: TraversedDocument
  } & XTagGroups
> & {
  /** Original input document hash */
  'x-scalar-original-document-hash': string
}

const OpenApiDocumentSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. This string MUST be the version number of the OpenAPI Specification that the OpenAPI Document uses. The openapi field SHOULD be used by tooling to interpret the OpenAPI Document. This is not related to the API info.version string. */
    openapi: Type.String(),
    /** REQUIRED. Provides metadata about the API. The metadata MAY be used by tooling as required. */
    info: InfoObjectRef,
    /** The default value for the $schema keyword within Schema Objects contained within this OAS document. This MUST be in the form of a URI. */
    jsonSchemaDialect: Type.Optional(Type.String()),
    /** An array of Server Objects, which provide connectivity information to a target server. If the servers field is not provided, or is an empty array, the default value would be a Server Object with a url value of /. */
    servers: Type.Optional(Type.Array(ServerObjectRef)),
    /** The available paths and operations for the API. */
    paths: Type.Optional(PathsObjectRef),
    /** The incoming webhooks that MAY be received as part of this API and that the API consumer MAY choose to implement. Closely related to the callbacks feature, this section describes requests initiated other than by an API call, for example by an out of band registration. The key name is a unique string to refer to each webhook, while the (optionally referenced) Path Item Object describes a request that may be initiated by the API provider and the expected responses. An example is available. */
    webhooks: Type.Optional(Type.Record(Type.String(), PathItemObjectRef)),
    /** An element to hold various Objects for the OpenAPI Description. */
    components: Type.Optional(ComponentsObjectRef),
    /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. Individual operations can override this definition. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
    security: Type.Optional(Type.Array(SecurityRequirementObjectRef)),
    /** A list of tags used by the OpenAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
    tags: Type.Optional(Type.Array(TagObjectRef)),
    /** Additional external documentation. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
  }),
  OpenApiExtensionsSchema,
)

export type OpenApiDocument = {
  /** REQUIRED. This string MUST be the version number of the OpenAPI Specification that the OpenAPI Document uses. The openapi field SHOULD be used by tooling to interpret the OpenAPI Document. This is not related to the API info.version string. */
  openapi: string
  /** REQUIRED. Provides metadata about the API. The metadata MAY be used by tooling as required. */
  info: InfoObject
  /** The default value for the $schema keyword within Schema Objects contained within this OAS document. This MUST be in the form of a URI. */
  jsonSchemaDialect?: string
  /** An array of Server Objects, which provide connectivity information to a target server. If the servers field is not provided, or is an empty array, the default value would be a Server Object with a url value of /. */
  servers?: ServerObject[]
  /** The available paths and operations for the API. */
  paths?: PathsObject
  /** The incoming webhooks that MAY be received as part of this API and that the API consumer MAY choose to implement. Closely related to the callbacks feature, this section describes requests initiated other than by an API call, for example by an out of band registration. The key name is a unique string to refer to each webhook, while the (optionally referenced) Path Item Object describes a request that may be initiated by the API provider and the expected responses. An example is available. */
  webhooks?: PathsObject
  /** An element to hold various Objects for the OpenAPI Description. */
  components?: ComponentsObject
  /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. Individual operations can override this definition. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
  security?: SecurityRequirementObject[]
  /** A list of tags used by the OpenAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
  tags?: TagObject[]
  /** Additional external documentation. */
  externalDocs?: ExternalDocumentationObject
} & OpenAPIExtensions

// ----- Module Definition ----
const module = Type.Module({
  [REF_DEFINITIONS.ComponentsObject]: ComponentsObjectSchemaDefinition,
  [REF_DEFINITIONS.SecurityRequirementObject]: SecurityRequirementObjectSchemaDefinition,
  [REF_DEFINITIONS.TagObject]: TagObjectSchemaDefinition,

  [REF_DEFINITIONS.CallbackObject]: CallbackObjectSchemaDefinition,
  [REF_DEFINITIONS.PathItemObject]: PathItemObjectSchemaDefinition,
  [REF_DEFINITIONS.PathsObject]: PathsObjectSchemaDefinition,
  [REF_DEFINITIONS.OperationObject]: OperationObjectSchemaDefinition,

  [REF_DEFINITIONS.SchemaObject]: SchemaObjectSchemaDefinition,

  [REF_DEFINITIONS.EncodingObject]: EncodingObjectSchemaDefinition,
  [REF_DEFINITIONS.MediaTypeObject]: MediaTypeObjectSchemaDefinition,
  [REF_DEFINITIONS.HeaderObject]: HeaderObjectSchemaDefinition,

  [REF_DEFINITIONS.ServerObject]: ServerObjectSchemaDefinition,
  [REF_DEFINITIONS.ExternalDocumentationObject]: ExternalDocumentationObjectSchemaDefinition,

  [REF_DEFINITIONS.InfoObject]: InfoObjectSchemaDefinition,
  [REF_DEFINITIONS.ContactObject]: ContactObjectSchemaDefinition,
  [REF_DEFINITIONS.LicenseObject]: LicenseObjectSchemaDefinition,
  [REF_DEFINITIONS.ResponseObject]: ResponseObjectSchemaDefinition,
  [REF_DEFINITIONS.ResponsesObject]: ResponsesObjectSchemaDefinition,
  [REF_DEFINITIONS.ParameterObject]: ParameterObjectSchemaDefinition,
  [REF_DEFINITIONS.ExampleObject]: ExampleObjectSchemaDefinition,
  [REF_DEFINITIONS.RequestBodyObject]: RequestBodyObjectSchemaDefinition,
  [REF_DEFINITIONS.SecuritySchemeObject]: SecuritySchemeObjectSchemaDefinition,
  [REF_DEFINITIONS.LinkObject]: LinkObjectSchemaDefinition,
  [REF_DEFINITIONS.XMLObject]: XMLObjectSchemaDefinition,
  [REF_DEFINITIONS.DiscriminatorObject]: DiscriminatorObjectSchemaDefinition,
  [REF_DEFINITIONS.OAuthFlowsObject]: OAuthFlowsObjectSchemaDefinition,
  [REF_DEFINITIONS.ServerVariableObject]: ServerVariableObjectSchemaDefinition,
  OpenApiDocument: OpenApiDocumentSchemaDefinition,

  // Navigation schemas
  [REF_DEFINITIONS.TraversedDescriptionObject]: TraversedDescriptionSchemaDefinition,
  [REF_DEFINITIONS.TraversedOperationObject]: TraversedOperationSchemaDefinition,
  [REF_DEFINITIONS.TraversedSchemaObject]: TraversedSchemaSchemaDefinition,
  [REF_DEFINITIONS.TraversedWebhookObject]: TraversedWebhookSchemaDefinition,
  [REF_DEFINITIONS.TraversedTagObject]: TraversedTagSchemaDefinition,
  [REF_DEFINITIONS.TraversedEntryObject]: TraversedEntrySchemaDefinition,
  [REF_DEFINITIONS.TraversedDocumentObject]: TraversedDocumentSchemaDefinition,
  // Enforces that all references are included in the module
} satisfies Record<keyof typeof REF_DEFINITIONS, TSchema> & Record<'OpenApiDocument', TSchema>)

//  ----- Schemas ----
export const OpenAPIDocumentSchema = module.Import('OpenApiDocument')

export const ComponentsObjectSchema = module.Import('ComponentsObject')
export const SecurityRequirementObjectSchema = module.Import('SecurityRequirementObject')
export const TagObjectSchema = module.Import('TagObject')

export const CallbackObjectSchema = module.Import('CallbackObject')
export const PathItemObjectSchema = module.Import('PathItemObject')
export const PathsObjectSchema = module.Import('PathsObject')
export const OperationObjectSchema = module.Import('OperationObject')

export const SchemaObjectSchema = module.Import('SchemaObject')

export const EncodingObjectSchema = module.Import('EncodingObject')
export const MediaTypeObjectSchema = module.Import('MediaTypeObject')
export const HeaderObjectSchema = module.Import('HeaderObject')

export const ServerObjectSchema = module.Import('ServerObject')
export const ExternalDocumentationObjectSchema = module.Import('ExternalDocumentationObject')

export const InfoObjectSchema = module.Import('InfoObject')
export const ContactObjectSchema = module.Import('ContactObject')
export const LicenseObjectSchema = module.Import('LicenseObject')
export const ResponseObjectSchema = module.Import('ResponseObject')
export const ResponsesObjectSchema = module.Import('ResponsesObject')
export const ParameterObjectSchema = module.Import('ParameterObject')
export const ExampleObjectSchema = module.Import('ExampleObject')
export const RequestBodyObjectSchema = module.Import('RequestBodyObject')
export const SecuritySchemeObjectSchema = module.Import('SecuritySchemeObject')
export const LinkObjectSchema = module.Import('LinkObject')
export const XMLObjectSchema = module.Import('XMLObject')
export const DiscriminatorObjectSchema = module.Import('DiscriminatorObject')
export const OAuthFlowsObjectSchema = module.Import('OAuthFlowsObject')
export const ServerVariableObjectSchema = module.Import('ServerVariableObject')

export const TraversedDescriptionSchema = module.Import('TraversedDescriptionObject')
export const TraversedEntrySchema = module.Import('TraversedEntryObject')
export const TraversedTagSchema = module.Import('TraversedTagObject')
export const TraversedOperationSchema = module.Import('TraversedOperationObject')
export const TraversedSchemaSchema = module.Import('TraversedSchemaObject')
export const TraversedWebhookSchema = module.Import('TraversedWebhookObject')

//  ----- Type re-exports ----
export type { ExternalDocumentationObject }
export type { InfoObject }
export type { PathsObject }
export type { SecurityRequirementObject }
export type { ServerObject }
export type { TagObject }

export type { CallbackObject } from './callback'
export type { ComponentsObject } from './components'
export type { ContactObject } from './contact'
export type { DiscriminatorObject } from './discriminator'
export type { EncodingObject } from './encoding'
export type { ExampleObject } from './example'
export type { HeaderObject } from './header'
export type { LicenseObject } from './license'
export type { LinkObject } from './link'
export type { MediaTypeObject } from './media-type'
export type { OAuthFlowsObject } from './oauthflows'
export type { OperationObject } from './operation'
export type { ParameterObject } from './parameter'
export type { PathItemObject } from './path-item'
export type { RequestBodyObject } from './request-body'
export type { ResponseObject } from './response'
export type { ResponsesObject } from './responses'
export type { SchemaObject } from './schema'
export type { SecuritySchemeObject } from './security-scheme'
export type { ServerVariableObject } from './server-variable'
export type { XMLObject } from './xml'
