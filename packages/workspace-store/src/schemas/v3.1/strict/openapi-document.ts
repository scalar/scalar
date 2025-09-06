import { type Static, type TSchema, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { extensions } from '@/schemas/extensions'
import { TraversedEntrySchema } from '@/schemas/navigation'
import { CallbackObjectSchemaDefinition } from '@/schemas/v3.1/strict/callback'
import { xScalarClientConfigCookiesSchema } from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-cookies'
import { xScalarClientConfigEnvironmentsSchema } from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-environments'
import { ContactObjectSchemaDefinition } from '@/schemas/v3.1/strict/contact'
import { DiscriminatorObjectSchemaDefinition } from '@/schemas/v3.1/strict/discriminator'
import { EncodingObjectSchemaDefinition } from '@/schemas/v3.1/strict/encoding'
import { ExampleObjectSchemaDefinition } from '@/schemas/v3.1/strict/example'
import { HeaderObjectSchemaDefinition } from '@/schemas/v3.1/strict/header'
import { LicenseObjectSchemaDefinition } from '@/schemas/v3.1/strict/license'
import { LinkObjectSchemaDefinition } from '@/schemas/v3.1/strict/link'
import { MediaTypeObjectSchemaDefinition } from '@/schemas/v3.1/strict/media-type'
import { OAuthFlowsObjectSchemaDefinition } from '@/schemas/v3.1/strict/oauthflows'
import { OperationObjectSchemaDefinition } from '@/schemas/v3.1/strict/operation'
import { ParameterObjectSchemaDefinition } from '@/schemas/v3.1/strict/parameter'
import { PathItemObjectSchemaDefinition } from '@/schemas/v3.1/strict/path-item'
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
} from '@/schemas/v3.1/strict/ref-definitions'
import { RequestBodyObjectSchemaDefinition } from '@/schemas/v3.1/strict/request-body'
import { ResponseObjectSchemaDefinition } from '@/schemas/v3.1/strict/response'
import { ResponsesObjectSchemaDefinition } from '@/schemas/v3.1/strict/responses'
import { SchemaObjectSchemaDefinition } from '@/schemas/v3.1/strict/schema'
import { SecuritySchemeObjectSchemaDefinition } from '@/schemas/v3.1/strict/security-scheme'
import { ServerVariableObjectSchemaDefinition } from '@/schemas/v3.1/strict/server-variable'
import { XMLObjectSchemaDefinition } from '@/schemas/v3.1/strict/xml'

import { ComponentsObjectSchemaDefinition } from './components'
import { ExternalDocumentationObjectSchemaDefinition } from './external-documentation'
import { InfoObjectSchemaDefinition } from './info'
import { PathsObjectSchemaDefinition } from './paths'
import { SecurityRequirementObjectSchemaDefinition } from './security-requirement'
import { ServerObjectSchemaDefinition } from './server'
import { TagObjectSchemaDefinition } from './tag'

const OpenApiExtensionsSchema = Type.Partial(
  Type.Object({
    'x-tagGroups': Type.Array(
      compose(
        Type.Object({
          tags: Type.Array(Type.String()),
        }),
        TagObjectRef,
      ),
    ),
    'x-scalar-client-config-active-environment': Type.String(),
    /** A custom icon representing the collection */
    'x-scalar-client-config-icon': Type.String(),
    'x-scalar-client-config-environments': xScalarClientConfigEnvironmentsSchema,
    'x-scalar-client-config-cookies': xScalarClientConfigCookiesSchema,
    'x-original-oas-version': Type.String(),
    [extensions.document.navigation]: Type.Array(TraversedEntrySchema),
  }),
)

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

// ----- Type Definitions ----
export type OpenApiDocument = Static<typeof OpenAPIDocumentSchema>

export type ComponentsObject = Static<typeof ComponentsObjectSchema>
export type SecurityRequirementObject = Static<typeof SecurityRequirementObjectSchema>
export type TagObject = Static<typeof TagObjectSchema>

export type CallbackObject = Static<typeof CallbackObjectSchema>
export type PathItemObject = Static<typeof PathItemObjectSchema>
export type PathsObject = Static<typeof PathsObjectSchema>
export type OperationObject = Static<typeof OperationObjectSchema>

export type SchemaObject = Static<typeof SchemaObjectSchema>

export type EncodingObject = Static<typeof EncodingObjectSchema>
export type MediaTypeObject = Static<typeof MediaTypeObjectSchema>
export type HeaderObject = Static<typeof HeaderObjectSchema>

export type ServerObject = Static<typeof ServerObjectSchema>
export type ExternalDocumentationObject = Static<typeof ExternalDocumentationObjectSchema>

export type InfoObject = Static<typeof InfoObjectSchema>
export type ContactObject = Static<typeof ContactObjectSchema>
export type LicenseObject = Static<typeof LicenseObjectSchema>
export type ResponseObject = Static<typeof ResponseObjectSchema>
export type ResponsesObject = Static<typeof ResponsesObjectSchema>
export type ParameterObject = Static<typeof ParameterObjectSchema>
export type ExampleObject = Static<typeof ExampleObjectSchema>
export type RequestBodyObject = Static<typeof RequestBodyObjectSchema>
export type SecuritySchemeObject = Static<typeof SecuritySchemeObjectSchema>
export type LinkObject = Static<typeof LinkObjectSchema>
export type XMLObject = Static<typeof XMLObjectSchema>
export type DiscriminatorObject = Static<typeof DiscriminatorObjectSchema>
export type OAuthFlowsObject = Static<typeof OAuthFlowsObjectSchema>
export type ServerVariableObject = Static<typeof ServerVariableObjectSchema>
