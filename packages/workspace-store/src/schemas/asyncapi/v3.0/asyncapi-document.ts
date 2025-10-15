import { type TSchema, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { extensions } from '@/schemas/extensions'
import { type XTagGroups, XTagGroupsSchema } from '@/schemas/extensions/tag/x-tag-groups'
import {
  TraversedDescriptionSchemaDefinition,
  type TraversedEntry,
  TraversedEntrySchemaDefinition,
  TraversedOperationSchemaDefinition,
  TraversedSchemaSchemaDefinition,
  TraversedTagSchemaDefinition,
  TraversedWebhookSchemaDefinition,
} from '@/schemas/navigation'
import {
  type XScalarClientConfigCookies,
  xScalarClientConfigCookiesSchema,
} from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-cookies'
import {
  type XScalarClientConfigEnvironments,
  xScalarClientConfigEnvironmentsSchema,
} from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-environments'
import { type ComponentsObject, ComponentsObjectSchemaDefinition } from '@/schemas/v3.1/strict/components'
import { ContactObjectSchemaDefinition } from '@/schemas/v3.1/strict/contact'
import {
  type ExternalDocumentationObject,
  ExternalDocumentationObjectSchemaDefinition,
} from '@/schemas/v3.1/strict/external-documentation'
import { type InfoObject, InfoObjectSchemaDefinition } from '@/schemas/v3.1/strict/info'
import { LicenseObjectSchemaDefinition } from '@/schemas/v3.1/strict/license'
import {
  ComponentsObjectRef,
  ExternalDocumentationObjectRef,
  InfoObjectRef,
  REF_DEFINITIONS,
  SecurityRequirementObjectRef,
  ServerObjectRef,
  TagObjectRef,
  TraversedEntryObjectRef,
} from '@/schemas/v3.1/strict/ref-definitions'
import {
  type SecurityRequirementObject,
  SecurityRequirementObjectSchemaDefinition,
} from '@/schemas/v3.1/strict/security-requirement'
import { type ServerObject, ServerObjectSchemaDefinition } from '@/schemas/v3.1/strict/server'
import { type TagObject, TagObjectSchemaDefinition } from '@/schemas/v3.1/strict/tag'

import { BindingSchemaDefinition } from './binding'
import { ChannelItemSchemaDefinition } from './channel-item'
// AsyncAPI-specific imports
import type { ChannelsObject } from './channels'
import { ChannelsObjectSchemaDefinition } from './channels'
import { CorrelationIdSchemaDefinition } from './correlation-id'
import { MessageSchemaDefinition } from './message'
import { MessageTraitSchemaDefinition } from './message-trait'
import { OperationSchemaDefinition } from './operation'
import { OperationTraitSchemaDefinition } from './operation-trait'
import type { OperationsObject } from './operations'
import { OperationsObjectSchemaDefinition } from './operations'
import { ParameterSchemaDefinition } from './parameter'
import { ReplySchemaDefinition } from './reply'
import { AsyncApiServerSchemaDefinition, AsyncApiServerVariableSchemaDefinition } from './server'

// AsyncAPI Extensions Schema
const AsyncApiExtensionsSchema = Type.Partial(
  compose(
    Type.Object({
      'x-scalar-client-config-active-environment': Type.String(),
      /** A custom icon representing the collection */
      'x-scalar-client-config-icon': Type.String(),
      'x-scalar-client-config-environments': xScalarClientConfigEnvironmentsSchema,
      'x-scalar-client-config-cookies': xScalarClientConfigCookiesSchema,
      'x-original-asyncapi-version': Type.String(),
      'x-scalar-selected-security': Type.Optional(Type.Array(SecurityRequirementObjectRef)),
      [extensions.document.navigation]: Type.Array(TraversedEntryObjectRef),
    }),
    XTagGroupsSchema,
  ),
)

export type AsyncApiExtensions = Partial<
  {
    'x-scalar-client-config-active-environment': string
    /** A custom icon representing the collection */
    'x-scalar-client-config-icon': string
    'x-scalar-client-config-environments': XScalarClientConfigEnvironments
    'x-scalar-client-config-cookies': XScalarClientConfigCookies
    'x-original-asyncapi-version': string
    'x-scalar-selected-security': SecurityRequirementObject[]
    [extensions.document.navigation]: TraversedEntry[]
  } & XTagGroups
>

// AsyncAPI Document Schema Definition
const AsyncApiDocumentSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. This string MUST be the version number of the AsyncAPI Specification that the AsyncAPI Document uses. The asyncapi field SHOULD be used by tooling to interpret the AsyncAPI Document. This is not related to the API info.version string. */
    asyncapi: Type.String(),
    /** REQUIRED. Provides metadata about the API. The metadata MAY be used by tooling as required. */
    info: InfoObjectRef,
    /** The default value for the $schema keyword within Schema Objects contained within this AsyncAPI document. This MUST be in the form of a URI. */
    jsonSchemaDialect: Type.Optional(Type.String()),
    /** An array of Server Objects, which provide connectivity information to a target server. If the servers field is not provided, or is an empty array, the default value would be a Server Object with a url value of /. */
    servers: Type.Optional(Type.Array(ServerObjectRef)),
    /** The available channels and operations for the API. */
    channels: Type.Optional(ChannelsObjectSchemaDefinition),
    /** The operations supported by the API. */
    operations: Type.Optional(OperationsObjectSchemaDefinition),
    /** An element to hold various Objects for the AsyncAPI Description. */
    components: Type.Optional(ComponentsObjectRef),
    /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. Individual operations can override this definition. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
    security: Type.Optional(Type.Array(SecurityRequirementObjectRef)),
    /** A list of tags used by the AsyncAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
    tags: Type.Optional(Type.Array(TagObjectRef)),
    /** Additional external documentation. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
    /** Identifier of the default content type the API is using for the message payloads. */
    defaultContentType: Type.Optional(Type.String()),
  }),
  AsyncApiExtensionsSchema,
)

export type AsyncApiDocument = {
  /** REQUIRED. This string MUST be the version number of the AsyncAPI Specification that the AsyncAPI Document uses. The asyncapi field SHOULD be used by tooling to interpret the AsyncAPI Document. This is not related to the API info.version string. */
  asyncapi: '3.0.0'
  /** REQUIRED. Provides metadata about the API. The metadata MAY be used by tooling as required. */
  info: InfoObject
  /** The default value for the $schema keyword within Schema Objects contained within this AsyncAPI document. This MUST be in the form of a URI. */
  jsonSchemaDialect?: string
  /** An array of Server Objects, which provide connectivity information to a target server. If the servers field is not provided, or is an empty array, the default value would be a Server Object with a url value of /. */
  servers?: ServerObject[]
  /** The available channels and operations for the API. */
  channels?: ChannelsObject
  /** The operations supported by the API. */
  operations?: OperationsObject
  /** An element to hold various Objects for the AsyncAPI Description. */
  components?: ComponentsObject
  /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. Individual operations can override this definition. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
  security?: SecurityRequirementObject[]
  /** A list of tags used by the AsyncAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
  tags?: TagObject[]
  /** Additional external documentation. */
  externalDocs?: ExternalDocumentationObject
  /** Identifier of the default content type the API is using for the message payloads. */
  defaultContentType?: string
} & AsyncApiExtensions

// ----- Module Definition ----
const module = Type.Module({
  [REF_DEFINITIONS.ComponentsObject]: ComponentsObjectSchemaDefinition,
  [REF_DEFINITIONS.SecurityRequirementObject]: SecurityRequirementObjectSchemaDefinition,
  [REF_DEFINITIONS.TagObject]: TagObjectSchemaDefinition,

  [REF_DEFINITIONS.ServerObject]: ServerObjectSchemaDefinition,
  [REF_DEFINITIONS.ExternalDocumentationObject]: ExternalDocumentationObjectSchemaDefinition,
  [REF_DEFINITIONS.InfoObject]: InfoObjectSchemaDefinition,
  [REF_DEFINITIONS.ContactObject]: ContactObjectSchemaDefinition,
  [REF_DEFINITIONS.LicenseObject]: LicenseObjectSchemaDefinition,

  AsyncApiDocument: AsyncApiDocumentSchemaDefinition,

  // AsyncAPI-specific schemas
  AsyncApiServer: AsyncApiServerSchemaDefinition,
  AsyncApiServerVariable: AsyncApiServerVariableSchemaDefinition,
  Binding: BindingSchemaDefinition,
  ChannelItem: ChannelItemSchemaDefinition,
  ChannelsObject: ChannelsObjectSchemaDefinition,
  CorrelationId: CorrelationIdSchemaDefinition,
  Message: MessageSchemaDefinition,
  MessageTrait: MessageTraitSchemaDefinition,
  Operation: OperationSchemaDefinition,
  OperationTrait: OperationTraitSchemaDefinition,
  OperationsObject: OperationsObjectSchemaDefinition,
  Parameter: ParameterSchemaDefinition,
  Reply: ReplySchemaDefinition,

  // Navigation schemas
  [REF_DEFINITIONS.TraversedDescriptionObject]: TraversedDescriptionSchemaDefinition,
  [REF_DEFINITIONS.TraversedOperationObject]: TraversedOperationSchemaDefinition,
  [REF_DEFINITIONS.TraversedSchemaObject]: TraversedSchemaSchemaDefinition,
  [REF_DEFINITIONS.TraversedWebhookObject]: TraversedWebhookSchemaDefinition,
  [REF_DEFINITIONS.TraversedTagObject]: TraversedTagSchemaDefinition,
  [REF_DEFINITIONS.TraversedEntryObject]: TraversedEntrySchemaDefinition,
} satisfies Record<string, TSchema>)

// ----- Schemas ----
export const AsyncApiDocumentSchema = module.Import('AsyncApiDocument')

export const ComponentsObjectSchema = module.Import('ComponentsObject')
export const SecurityRequirementObjectSchema = module.Import('SecurityRequirementObject')
export const TagObjectSchema = module.Import('TagObject')

export const ServerObjectSchema = module.Import('ServerObject')
export const ExternalDocumentationObjectSchema = module.Import('ExternalDocumentationObject')

export const InfoObjectSchema = module.Import('InfoObject')
export const ContactObjectSchema = module.Import('ContactObject')
export const LicenseObjectSchema = module.Import('LicenseObject')

// AsyncAPI-specific schema exports
export const AsyncApiServerSchema = module.Import('AsyncApiServer')
export const AsyncApiServerVariableSchema = module.Import('AsyncApiServerVariable')
export const BindingSchema = module.Import('Binding')
export const ChannelItemSchema = module.Import('ChannelItem')
export const ChannelsObjectSchema = module.Import('ChannelsObject')
export const CorrelationIdSchema = module.Import('CorrelationId')
export const MessageSchema = module.Import('Message')
export const MessageTraitSchema = module.Import('MessageTrait')
export const OperationSchema = module.Import('Operation')
export const OperationTraitSchema = module.Import('OperationTrait')
export const OperationsObjectSchema = module.Import('OperationsObject')
export const ParameterSchema = module.Import('Parameter')
export const ReplySchema = module.Import('Reply')

export const TraversedDescriptionSchema = module.Import('TraversedDescriptionObject')
export const TraversedEntrySchema = module.Import('TraversedEntryObject')
export const TraversedTagSchema = module.Import('TraversedTagObject')
export const TraversedOperationSchema = module.Import('TraversedOperationObject')
export const TraversedSchemaSchema = module.Import('TraversedSchemaObject')
export const TraversedWebhookSchema = module.Import('TraversedWebhookObject')

// ----- Type re-exports ----
export type { ExternalDocumentationObject }
export type { InfoObject }
export type { SecurityRequirementObject }
export type { ServerObject }
export type { TagObject }

export type { ComponentsObject } from '@/schemas/v3.1/strict/components'
export type { ContactObject } from '@/schemas/v3.1/strict/contact'
export type { LicenseObject } from '@/schemas/v3.1/strict/license'
